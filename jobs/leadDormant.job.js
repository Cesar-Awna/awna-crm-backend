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

const startLeadDormantJob = () => {
    if (initialized) return;
    initialized = true;

    connectMongoDB();

    console.log('⏱️ [leadDormant.job] Programando job de leads dormidos (cada 1 hora)...');

    cron.schedule('0 * * * *', async () => {
        const startedAt = new Date();
        console.log('▶️ [leadDormant.job] Recalculando leads dormidos...');

        try {
            const [rules, leads] = await Promise.all([
                SlaStageRule.find({ isActive: true }).lean(),
                Lead.find({ status: 'OPEN' })
                    .select(
                        '_id companyId businessUnitId currentStageId lastActivityAt createdAt isDormant'
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
                if (!rule || !rule.maxDaysWithoutActivity) continue;

                const refDate = lead.lastActivityAt || lead.createdAt;
                if (!refDate) continue;

                const daysWithoutActivity = getDaysDiff(refDate, now);
                const shouldBeDormant = daysWithoutActivity > rule.maxDaysWithoutActivity;

                if (Boolean(lead.isDormant) === shouldBeDormant) continue;

                bulkOps.push({
                    updateOne: {
                        filter: { _id: lead._id },
                        update: { $set: { isDormant: shouldBeDormant } },
                    },
                });
            }

            if (bulkOps.length) {
                await Lead.bulkWrite(bulkOps);
            }

            const finishedAt = new Date();
            console.log(
                `✅ [leadDormant.job] Leads dormidos recalculados. Actualizados=${bulkOps.length} TiempoMs=${
                    finishedAt.getTime() - startedAt.getTime()
                }`
            );
        } catch (error) {
            console.error('❌ [leadDormant.job] Error al recalcular leads dormidos:', error);
        }
    });
};

export default startLeadDormantJob;

