import cron from 'node-cron';
import connectMongoDB from '../libs/mongoose.js';
import Lead from '../models/Lead.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import BusinessUnit from '../models/BusinessUnit.js';
import { buildBUStageTypeMaps } from '../utils/stageInfo.js';

let initialized = false;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const startOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const generateNotifications = async () => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const sevenDaysAgo = new Date(now.getTime() - 7 * MS_PER_DAY);

    console.log('▶️ [notifications.job] Generando notificaciones...');

    const allBUs = await BusinessUnit.find({}).select('companyId pipelineStages').lean();
    const { closedStatusSet } = buildBUStageTypeMaps(allBUs);

    // MEETING_TODAY: open leads with nextContactDate today
    const meetingLeads = await Lead.find({
        status: { $nin: [...closedStatusSet] },
        ownerUserId: { $exists: true, $nin: [null, ''] },
        nextContactDate: { $gte: todayStart, $lte: now },
    })
        .select('_id companyId businessUnitId ownerUserId')
        .lean();

    let meetingCount = 0;
    for (const lead of meetingLeads) {
        const existing = await Notification.findOne({
            userId: String(lead.ownerUserId),
            leadId: String(lead._id),
            type: 'MEETING_TODAY',
            createdAt: { $gte: todayStart },
        })
            .select('_id')
            .lean();

        if (!existing) {
            await Notification.create({
                companyId: lead.companyId,
                businessUnitId: lead.businessUnitId,
                userId: String(lead.ownerUserId),
                leadId: String(lead._id),
                type: 'MEETING_TODAY',
                title: 'Contacto programado hoy',
                body: 'Tienes un contacto programado para hoy en este lead.',
            });
            meetingCount++;
        }
    }

    // LEAD_DORMANT: open leads not updated in 7+ days
    const dormantLeads = await Lead.find({
        status: { $nin: [...closedStatusSet] },
        ownerUserId: { $exists: true, $nin: [null, ''] },
        updatedAt: { $lt: sevenDaysAgo },
    })
        .select('_id companyId businessUnitId ownerUserId')
        .lean();

    let dormantCount = 0;
    for (const lead of dormantLeads) {
        const existing = await Notification.findOne({
            userId: String(lead.ownerUserId),
            leadId: String(lead._id),
            type: 'LEAD_DORMANT',
            createdAt: { $gte: todayStart },
        })
            .select('_id')
            .lean();

        if (!existing) {
            await Notification.create({
                companyId: lead.companyId,
                businessUnitId: lead.businessUnitId,
                userId: String(lead.ownerUserId),
                leadId: String(lead._id),
                type: 'LEAD_DORMANT',
                title: 'Lead sin actividad',
                body: 'Este lead lleva más de 7 días sin actualización.',
            });
            dormantCount++;
        }
    }

    // LEAD_DORMANT_SUPERVISOR: notify supervisor when their executive's lead has 5+ days without activity
    const fiveDaysAgo = new Date(now.getTime() - 5 * MS_PER_DAY);
    const dormantForSupervisor = await Lead.find({
        status: { $nin: [...closedStatusSet] },
        ownerUserId: { $exists: true, $nin: [null, ''] },
        updatedAt: { $lt: fiveDaysAgo },
    })
        .select('_id companyId businessUnitId ownerUserId fields razonSocial')
        .lean();

    // Cache executives and their supervisors to avoid redundant DB calls
    const execCache = {};
    let supervisorNotifCount = 0;

    for (const lead of dormantForSupervisor) {
        const execId = String(lead.ownerUserId);

        if (!execCache[execId]) {
            const exec = await User.findOne({ _id: execId })
                .select('fullName supervisorId')
                .lean();
            execCache[execId] = exec || null;
        }

        const exec = execCache[execId];
        if (!exec?.supervisorId) continue;

        const supervisorId = String(exec.supervisorId);
        const leadName = lead.fields?.razonSocial || lead.fields?.nombre ||
                         lead.razonSocial || 'Sin nombre';

        const existing = await Notification.findOne({
            userId: supervisorId,
            leadId: String(lead._id),
            type: 'LEAD_DORMANT_SUPERVISOR',
            createdAt: { $gte: todayStart },
        })
            .select('_id')
            .lean();

        if (!existing) {
            await Notification.create({
                companyId: lead.companyId,
                businessUnitId: lead.businessUnitId,
                userId: supervisorId,
                leadId: String(lead._id),
                type: 'LEAD_DORMANT_SUPERVISOR',
                title: 'Lead dormido en tu equipo',
                body: `${exec.fullName} tiene un lead sin actividad hace más de 5 días: ${leadName}`,
            });
            supervisorNotifCount++;
        }
    }

    console.log(
        `✅ [notifications.job] Generadas: ${meetingCount} MEETING_TODAY, ${dormantCount} LEAD_DORMANT, ${supervisorNotifCount} LEAD_DORMANT_SUPERVISOR`
    );
};

const startNotificationsJob = () => {
    if (initialized) return;
    initialized = true;

    connectMongoDB();

    console.log('⏱️ [notifications.job] Programando job de notificaciones (diario 08:00)...');

    cron.schedule('0 8 * * *', async () => {
        console.log('▶️ [notifications.job] Iniciando generación diaria de notificaciones...');
        try {
            await generateNotifications();
        } catch (error) {
            console.error('❌ [notifications.job] Error:', error);
        }
    });
};

export default startNotificationsJob;
