import RankingService from '../services/ranking.service.js';

const rankingService = new RankingService();

export default class RankingController {
    getWeekly = async (req, res) => {
        try {
            const response = await rankingService.getWeekly(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    getMonthly = async (req, res) => {
        try {
            const response = await rankingService.getMonthly(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    getMe = async (req, res) => {
        try {
            const response = await rankingService.getMe(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    getByUser = async (req, res) => {
        try {
            const response = await rankingService.getByUser(req);
            return res.status(response.success ? 200 : 404).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };
}
