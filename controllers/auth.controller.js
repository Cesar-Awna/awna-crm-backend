import AuthService from '../services/auth.service.js';

const authService = new AuthService();

export default class AuthController {
    login = async (req, res) => {
        try {
            const response = await authService.login(req);
            return res.status(response.success ? 200 : 401).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    refresh = async (req, res) => {
        try {
            const response = await authService.refresh(req);
            return res.status(response.success ? 200 : 401).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    logout = async (req, res) => {
        try {
            const response = await authService.logout(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    me = async (req, res) => {
        try {
            const response = await authService.me(req);
            return res.status(response.success ? 200 : 401).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    updateProfile = async (req, res) => {
        try {
            const response = await authService.updateProfile(req);
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller error:', error);
            return res.status(500).json({
                success: false,
                message: 'Unexpected controller error',
            });
        }
    };

    changePassword = async (req, res) => {
        try {
            const response = await authService.changePassword(req);
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
