import cron from 'node-cron';
import connectMongoDB from '../libs/mongoose.js';
import Lead from '../models/Lead.js';
import SlaStageRule from '../models/SlaStageRule.js';

let initialized = false;

const getDaysDiff = (from, to) => {
    if (!from || !to) return 0;
    const msPerDay = 1000 * 60 * 60 * 24;
    return (to.getTime() - from.getTime()) / msPerDay;
};

const buildSlaRuleMap = (rules) => {
    const map = new Map();
    for (const rule of rules) {
        const key = `${rule.companyId}:${String(rule.businessUnitId || '')}:${String(
            rule.stageId
        )}`;
        map.set(key, rule);
    }
    return map;
};

const resolveStagnationLevel = (pctUsed, rule) => {
    const riskThreshold = rule?.riskThresholdPct ?? 80;
    const criticalThreshold = rule?.criticalThresholdPct ?? 150;

    if (pctUsed >= criticalThreshold) return 'CRITICAL';
    if (pctUsed >= 100) return 'OVERDUE';
    if (pctUsed >= riskThreshold) return 'RISK';
    return null;
};

const startLeadStagnationJob = () => {
    if (initialized) return;
    initialized = true;

    connectMongoDB();

    console.log('⏱️ [leadStagnation.job] Programando job de estancamiento (cada 1 hora)...');

    cron.schedule('0 * * * *', async () => {
        const startedAt = new Date();
        console.log('▶️ [leadStagnation.job] Recalculando estancamiento de leads...');

        try {
            const [rules, leads] = await Promise.all([
                SlaStageRule.find({ isActive: true }).lean(),
                Lead.find({ status: 'OPEN' })
                    .select(
                        '_id companyId businessUnitId currentStageId lastStageChangedAt createdAt stagnationLevel'
                    )
                    .lean(),
            ]);

            const slaMap = buildSlaRuleMap(rules);
            const now = new Date();
            const bulkOps = [];

            for (const lead of leads) {
                const key = `${lead.companyId}:${String(lead.businessUnitId || '')}:${String(
                    lead.currentStageId
                )}`;
                const rule = slaMap.get(key);
                if (!rule || !rule.maxDaysWithoutStageChange) continue;

                const refDate = lead.lastStageChangedAt || lead.createdAt;
                if (!refDate) continue;

                const elapsedDays = getDaysDiff(refDate, now);
                const pctUsed = (elapsedDays / rule.maxDaysWithoutStageChange) * 100;
                const level = resolveStagnationLevel(pctUsed, rule);

                if ((lead.stagnationLevel || null) === (level || null)) continue;

                bulkOps.push({
                    updateOne: {
                        filter: { _id: lead._id },
                        update: { $set: { stagnationLevel: level } },
                    },
                });
            }

            if (bulkOps.length) {
                await Lead.bulkWrite(bulkOps);
            }

            const finishedAt = new Date();
            console.log(
                `✅ [leadStagnation.job] Estancamiento recalculado. Actualizados=${bulkOps.length} TiempoMs=${
                    finishedAt.getTime() - startedAt.getTime()
                }`
            );
        } catch (error) {
            console.error('❌ [leadStagnation.job] Error al recalcular estancamiento:', error);
        }
    });
};

export default startLeadStagnationJob;

