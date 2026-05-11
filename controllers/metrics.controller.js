import MetricsService from '../services/metrics.service.js';

const metricsService = new MetricsService();

export default class MetricsController {
    getExecutiveMetrics = async (req, res) => {
        try {
            const response = await metricsService.getExecutiveMetrics(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    getSupervisorMetrics = async (req, res) => {
        try {
            const response = await metricsService.getSupervisorMetrics(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    getConversionMetrics = async (req, res) => {
        try {
            const response = await metricsService.getConversionMetrics(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    getSummaryMetrics = async (req, res) => {
        try {
            const response = await metricsService.getSummaryMetrics(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    getActivityMetrics = async (req, res) => {
        try {
            const response = await metricsService.getActivityMetrics(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({ success: false, message: 'Unexpected controller error' });
        }
    };

    getMyMetrics = async (req, res) => {
        try {
            const response = await metricsService.getMyMetrics(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    getActivityCounters = async (req, res) => {
        try {
            const response = await metricsService.getActivityCounters(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };
}
