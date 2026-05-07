import cron from 'node-cron';
import connectMongoDB from '../libs/mongoose.js';
import Lead from '../models/Lead.js';
import LeadEvent from '../models/LeadEvent.js';
import BusinessUnit from '../models/BusinessUnit.js';
import RankingPeriodScore from '../models/RankingPeriodScore.js';
import User from '../models/User.js';
import { buildBUStageTypeMaps, FALLBACK_CLOSED } from '../utils/stageInfo.js';

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

const buildPointMapFromBUs = (businessUnits) => {
    const map = new Map();
    for (const bu of businessUnits) {
        for (const at of (bu.activityTypes || [])) {
            const key = `${bu.companyId}:${String(bu._id)}:${at.key}`;
            map.set(key, { points: at.pointValue ?? 1, dailyCap: at.dailyCap ?? null });
        }
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

    const executives = await User.find({ roleName: 'EXECUTIVE' }).select('_id').lean();
    const executiveIds = new Set(executives.map((u) => String(u._id)));

    const [businessUnits, events] = await Promise.all([
        BusinessUnit.find({}).select('companyId activityTypes').lean(),
        LeadEvent.find({
            eventAt: { $gte: start, $lte: end },
        })
            .select('companyId businessUnitId userId eventType eventAt')
            .lean(),
    ]);

    const pointMap = buildPointMapFromBUs(businessUnits);
    const { stageTypeMap, closedStatusSet } = buildBUStageTypeMaps(businessUnits);

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
                openLeadsCount: 0,
                openLeadsAgeSum: 0,
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
        if (!executiveIds.has(String(userId))) continue;

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
        status: { $in: [...closedStatusSet] },
        updatedAt: { $gte: start, $lte: end },
    })
        .select('companyId businessUnitId ownerUserId status')
        .lean();

    for (const lead of closedLeads) {
        const companyId = lead.companyId;
        const businessUnitId = lead.businessUnitId;
        const userId = lead.ownerUserId;
        if (!companyId || !businessUnitId || !userId) continue;
        if (!executiveIds.has(String(userId))) continue;
        const agg = ensureAgg(companyId, businessUnitId, userId);

        const mapKey   = `${companyId}:${String(businessUnitId)}:${lead.status}`;
        const stageType = stageTypeMap.get(mapKey);
        const isWon  = stageType ? stageType === 'won'  : lead.status === 'CERRADO_GANADO';
        const isLost = stageType ? stageType === 'lost' : lead.status === 'CERRADO_PERDIDO';
        if (isWon)  agg.closedWon  += 1;
        if (isLost) agg.closedLost += 1;
    }

    // Progress score basado en leads abiertos
    const openLeads = await Lead.find({
        status: { $nin: [...closedStatusSet] },
    })
        .select('companyId businessUnitId ownerUserId createdAt updatedAt')
        .lean();

    const nowDay = new Date();
    const sevenDaysAgo = new Date(nowDay.getTime() - 7 * MS_PER_DAY);

    for (const lead of openLeads) {
        const companyId = lead.companyId;
        const businessUnitId = lead.businessUnitId;
        const userId = lead.ownerUserId;
        if (!companyId || !businessUnitId || !userId) continue;
        if (!executiveIds.has(String(userId))) continue;

        const agg = ensureAgg(companyId, businessUnitId, userId);
        agg.openLeadsCount += 1;

        if (lead.createdAt) {
            const ageDays = (nowDay.getTime() - new Date(lead.createdAt).getTime()) / MS_PER_DAY;
            agg.openLeadsAgeSum += ageDays;
        }

        if (
            lead.updatedAt &&
            new Date(lead.updatedAt).getTime() >= sevenDaysAgo.getTime()
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
        const pctAdvanced =
            agg.openLeadsCount > 0 ? agg.advancedIn7Days / agg.openLeadsCount : 0;

        const activityScore = agg.activityScore;
        const resultScore = Math.round(closeRate * 100) + agg.closedWon * 5;
        const progressScore = Math.max(
            0,
            Math.round(pctAdvanced * 100 - avgAge / 5)
        );
        const totalScore = activityScore + resultScore + progressScore;

        const kpisSnapshot = {
            closedWon: agg.closedWon,
            closedLost: agg.closedLost,
            closeRate,
            openLeadsCount: agg.openLeadsCount,
            avgAge,
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

