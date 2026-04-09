import LeadDocumentsService from '../services/leadDocuments.service.js';

const leadDocumentsService = new LeadDocumentsService();

export default class LeadDocumentsController {
    getByLeadId = async (req, res) => {
        try {
            const response = await leadDocumentsService.getByLeadId(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    getById = async (req, res) => {
        try {
            const response = await leadDocumentsService.getById(req);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    upload = async (req, res) => {
        try {
            const response = await leadDocumentsService.upload(req);
            return res.status(response.success ? 201 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    delete = async (req, res) => {
        try {
            const response = await leadDocumentsService.delete(req);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    download = async (req, res) => {
        try {
            const response = await leadDocumentsService.download(req);
            if (!response.success) {
                return res.status(404).json(response);
            }
            if (response.redirectUrl) {
                return res.redirect(302, response.redirectUrl);
            }
            return res.status(200).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    /** Misma lógica que download, pero JSON para abrir en nueva pestaña desde el SPA (Authorization header). */
    signedUrl = async (req, res) => {
        try {
            const response = await leadDocumentsService.download(req);
            if (!response.success) {
                return res.status(404).json(response);
            }
            return res.status(200).json({
                success: true,
                message: 'Signed URL',
                data: { url: response.redirectUrl || null },
            });
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };
}
