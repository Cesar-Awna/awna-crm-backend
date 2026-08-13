import connectMongoDB from '../libs/mongoose.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const TICKET_TYPES = [
    'ERROR_SISTEMA',
    'DUDA_USO',
    'SUGERENCIA',
    'PROBLEMA_LEADS',
    'PROBLEMA_ACCESO',
];

const TICKET_STATUSES = ['ABIERTO', 'EN_REVISION', 'RESUELTO'];

export default class TicketsService {
    constructor() {
        connectMongoDB();
    }

    create = async (req) => {
        try {
            const companyId = req.companyId;
            const userId = req.user?.id || req.user?._id;
            if (!companyId || !userId) return { success: false, message: 'Context required' };

            const { type, title, description, evidenceUrl } = req.body || {};

            if (!type || !TICKET_TYPES.includes(type)) {
                return { success: false, message: 'Tipo de ticket inválido' };
            }
            if (!title || !String(title).trim()) {
                return { success: false, message: 'El título es obligatorio' };
            }

            const reporter = await User.findOne({ _id: String(userId) })
                .select('fullName businessUnitIds')
                .lean();

            const businessUnitId =
                req.headers['x-business-unit-id']?.trim() ||
                reporter?.businessUnitIds?.[0] ||
                null;

            const ticket = await Ticket.create({
                companyId,
                businessUnitId,
                userId: String(userId),
                userFullName: reporter?.fullName || '',
                type,
                title: String(title).trim(),
                description: String(description || '').trim(),
                evidenceUrl: String(evidenceUrl || '').trim(),
                status: 'ABIERTO',
            });

            // Notify support users of the company about the new ticket
            const supportUsers = await User.find({
                companyId,
                roleName: 'SOPORTE',
                isActive: { $ne: false },
            })
                .select('_id')
                .lean();

            for (const su of supportUsers) {
                await Notification.create({
                    companyId,
                    businessUnitId,
                    userId: String(su._id),
                    type: 'TICKET_NUEVO',
                    title: 'Nuevo ticket de soporte',
                    body: `${reporter?.fullName || 'Un usuario'} reportó: ${ticket.title}`,
                    metadata: { ticketId: String(ticket._id) },
                });
            }

            return { success: true, message: 'Ticket creado', data: ticket };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error creando el ticket' };
        }
    };

    getMine = async (req) => {
        try {
            const companyId = req.companyId;
            const userId = req.user?.id || req.user?._id;
            if (!companyId || !userId) return { success: false, message: 'Context required' };

            const data = await Ticket.find({ companyId, userId: String(userId) })
                .sort({ createdAt: -1 })
                .lean();

            return { success: true, message: 'Tickets retrieved', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error obteniendo tickets' };
        }
    };

    getAll = async (req) => {
        try {
            const companyId = req.companyId;
            if (!companyId) return { success: false, message: 'Company context required' };

            const { status, type, businessUnitId } = req.query || {};
            const filter = { companyId };
            if (status && TICKET_STATUSES.includes(status)) filter.status = status;
            if (type && TICKET_TYPES.includes(type)) filter.type = type;
            if (businessUnitId) filter.businessUnitId = businessUnitId;

            const data = await Ticket.find(filter).sort({ createdAt: -1 }).lean();

            return { success: true, message: 'Tickets retrieved', data };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error obteniendo tickets' };
        }
    };

    updateStatus = async (req) => {
        try {
            const companyId = req.companyId;
            const userId = req.user?.id || req.user?._id;
            if (!companyId || !userId) return { success: false, message: 'Context required' };

            const { id } = req.params;
            const { status, response } = req.body || {};

            if (!status || !TICKET_STATUSES.includes(status)) {
                return { success: false, message: 'Estado inválido' };
            }

            const update = { status };
            if (response !== undefined) update.response = String(response || '').trim();
            if (status === 'RESUELTO') {
                update.resolvedAt = new Date();
                update.resolvedByUserId = String(userId);
            }

            const doc = await Ticket.findOneAndUpdate(
                { _id: id, companyId },
                update,
                { new: true, lean: true }
            );
            if (!doc) return { success: false, message: 'Ticket no encontrado' };

            // Notify the reporter when their ticket is resolved
            if (status === 'RESUELTO') {
                await Notification.create({
                    companyId,
                    businessUnitId: doc.businessUnitId,
                    userId: doc.userId,
                    type: 'TICKET_RESUELTO',
                    title: 'Tu ticket fue resuelto',
                    body: `Tu ticket "${doc.title}" fue resuelto.${doc.response ? ` Respuesta: ${doc.response}` : ''}`,
                    metadata: { ticketId: String(doc._id) },
                });
            }

            return { success: true, message: 'Ticket actualizado', data: doc };
        } catch (error) {
            console.error('❌ Service error:', error);
            return { success: false, message: 'Error actualizando el ticket' };
        }
    };
}
