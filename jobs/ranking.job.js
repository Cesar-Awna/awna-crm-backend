import cron from 'node-cron';
import connectMongoDB from '../libs/mongoose.js';
import Lead from '../models/Lead.js';
import LeadEvent from '../models/LeadEvent.js';
import RankingEventPoint from '../models/RankingEventPoint.js';
import RankingPeriodScore from '../models/RankingPeriodScore.js';

let initialized = false;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const startOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const endOfDay = (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};

const getWeekRange = (date) => {
    const d = startOfDay(date);
    const day = d.getDay(); // 0 = domingo
    const diffToMonday = (day + 6) % 7;
    const start = new Date(d.getTime() - diffToMonday * MS_PER_DAY);
    const end = endOfDay(new Date(start.getTime() + 6 * MS_PER_DAY));
    return { start, end };
};

const getMonthRange = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = endOfDay(new Date(year, month + 1, 0, 0, 0, 0, 0));
    return { start, end };
};

const buildRankingEventPointMap = (rules) => {
    const map = new Map();
    for (const rule of rules) {
        const key = `${rule.companyId}:${String(rule.businessUnitId || '')}:${
            rule.eventType
        }`;
        map.set(key, rule);
    }
    return map;
};

const processPeriod = async (periodType) => {
    const now = new Date();
    const { start, end } =
        periodType === 'WEEK' ? getWeekRange(now) : getMonthRange(now);

    console.log(
        `▶️ [ranking.job] Recalculando ranking ${periodType} (${start.toISOString()} - ${end.toISOString()})`
    );

    const [eventPoints, events] = await Promise.all([
        RankingEventPoint.find({}).lean(),
        LeadEvent.find({
            eventAt: { $gte: start, $lte: end },
        })
            .select('companyId businessUnitId userId eventType eventAt')
            .lean(),
    ]);

    const pointMap = buildRankingEventPointMap(eventPoints);

    const keyForUser = (companyId, businessUnitId, userId) =>
        `${companyId}:${String(businessUnitId || '')}:${userId}`;

    const aggregates = new Map();
    const ensureAgg = (companyId, businessUnitId, userId) => {
        const key = keyForUser(companyId, businessUnitId, userId);
        if (!aggregates.has(key)) {
            aggregates.set(key, {
                companyId,
                businessUnitId,
                userId,
                activityScore: 0,
                closedWon: 0,
                closedLost: 0,
                closedAmount: 0,
                openLeadsCount: 0,
                openLeadsAgeSum: 0,
                dormantCount: 0,
                advancedIn7Days: 0,
            });
        }
        return aggregates.get(key);
    };

    // Activity score con dailyCap
    const dailyUsage = new Map(); // key: company:bu:user:eventType:YYYY-MM-DD -> pointsUsed

    for (const ev of events) {
        const companyId = ev.companyId;
        const businessUnitId = ev.businessUnitId;
        const userId = ev.userId;
        if (!companyId || !businessUnitId || !userId) continue;

        const ruleKey = `${companyId}:${String(businessUnitId || '')}:${ev.eventType}`;
        const rule = pointMap.get(ruleKey);
        if (!rule) continue;

        const dayKeyDate = startOfDay(ev.eventAt);
        const dayKey = `${companyId}:${String(businessUnitId || '')}:${userId}:${
            ev.eventType
        }:${dayKeyDate.toISOString().slice(0, 10)}`;

        const used = dailyUsage.get(dayKey) || 0;
        const cap = rule.dailyCap || null;
        const remaining = cap != null ? Math.max(0, cap - used) : Infinity;
        const toAdd = remaining <= 0 ? 0 : Math.min(remaining, rule.points);

        if (toAdd > 0) {
            dailyUsage.set(dayKey, used + toAdd);
            const agg = ensureAgg(companyId, businessUnitId, userId);
            agg.activityScore += toAdd;
        }
    }

    // Result score basado en leads cerrados
    const closedLeads = await Lead.find({
        status: { $in: ['WON', 'LOST'] },
        closedAt: { $gte: start, $lte: end },
    })
        .select('companyId businessUnitId ownerUserId status closedAmount')
        .lean();

    for (const lead of closedLeads) {
        const companyId = lead.companyId;
        const businessUnitId = lead.businessUnitId;
        const userId = lead.ownerUserId;
        if (!companyId || !businessUnitId || !userId) continue;
        const agg = ensureAgg(companyId, businessUnitId, userId);
        if (lead.status === 'WON') agg.closedWon += 1;
        if (lead.status === 'LOST') agg.closedLost += 1;
        if (lead.closedAmount) agg.closedAmount += lead.closedAmount;
    }

    // Progress score basado en leads abiertos
    const openLeads = await Lead.find({
        status: 'OPEN',
    })
        .select(
            'companyId businessUnitId ownerUserId createdAt isDormant lastStageChangedAt'
        )
        .lean();

    const nowDay = new Date();
    const sevenDaysAgo = new Date(nowDay.getTime() - 7 * MS_PER_DAY);

    for (const lead of openLeads) {
        const companyId = lead.companyId;
        const businessUnitId = lead.businessUnitId;
        const userId = lead.ownerUserId;
        if (!companyId || !businessUnitId || !userId) continue;

        const agg = ensureAgg(companyId, businessUnitId, userId);
        agg.openLeadsCount += 1;

        if (lead.createdAt) {
            const ageDays = (nowDay.getTime() - new Date(lead.createdAt).getTime()) / MS_PER_DAY;
            agg.openLeadsAgeSum += ageDays;
        }

        if (lead.isDormant) {
            agg.dormantCount += 1;
        }

        if (
            lead.lastStageChangedAt &&
            new Date(lead.lastStageChangedAt).getTime() >= sevenDaysAgo.getTime()
        ) {
            agg.advancedIn7Days += 1;
        }
    }

    // Upsert en RankingPeriodScore
    for (const [, agg] of aggregates.entries()) {
        const totalClosed = agg.closedWon + agg.closedLost;
        const closeRate = totalClosed > 0 ? agg.closedWon / totalClosed : 0;

        const avgAge =
            agg.openLeadsCount > 0 ? agg.openLeadsAgeSum / agg.openLeadsCount : 0;
        const pctDormant =
            agg.openLeadsCount > 0 ? agg.dormantCount / agg.openLeadsCount : 0;
        const pctAdvanced =
            agg.openLeadsCount > 0 ? agg.advancedIn7Days / agg.openLeadsCount : 0;

        const activityScore = agg.activityScore;
        const resultScore =
            Math.round(closeRate * 100) + agg.closedWon * 5 + agg.closedAmount / 1000;
        const progressScore = Math.max(
            0,
            Math.round(pctAdvanced * 100 - pctDormant * 100 - avgAge / 5)
        );
        const totalScore = activityScore + resultScore + progressScore;

        const kpisSnapshot = {
            closedWon: agg.closedWon,
            closedLost: agg.closedLost,
            closedAmount: agg.closedAmount,
            closeRate,
            openLeadsCount: agg.openLeadsCount,
            avgAge,
            pctDormant,
            pctAdvanced,
            activityScore,
            resultScore,
            progressScore,
        };

        await RankingPeriodScore.findOneAndUpdate(
            {
                companyId: agg.companyId,
                businessUnitId: agg.businessUnitId,
                periodType,
                periodStart: start,
                userId: agg.userId,
            },
            {
                companyId: agg.companyId,
                businessUnitId: agg.businessUnitId,
                periodType,
                periodStart: start,
                periodEnd: end,
                userId: agg.userId,
                activityScore,
                progressScore,
                resultScore,
                totalScore,
                computedAt: new Date(),
                kpisSnapshot,
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        );
    }

    console.log(
        `✅ [ranking.job] Ranking ${periodType} recalculado para ${aggregates.size} combinaciones empresa/unidad/usuario`
    );
};

const startRankingJob = () => {
    if (initialized) return;
    initialized = true;

    connectMongoDB();

    console.log('⏱️ [ranking.job] Programando job de ranking (diario 02:00)...');

    cron.schedule('0 2 * * *', async () => {
        console.log('▶️ [ranking.job] Iniciando recálculo diario de ranking...');
        try {
            await processPeriod('WEEK');
        } catch (error) {
            console.error('❌ [ranking.job] Error en ranking semanal:', error);
        }

        try {
            await processPeriod('MONTH');
        } catch (error) {
            console.error('❌ [ranking.job] Error en ranking mensual:', error);
        }
    });
};

export default startRankingJob;

