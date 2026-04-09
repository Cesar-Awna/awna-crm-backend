import ExampleService from '../services/example.service.js';

const exampleService = new ExampleService();

export default class ExampleController {
    getStatus = async (req, res) => {
        try {
            const response = await exampleService.getStatus();
            return res.status(response.success ? 200 : 400).json(response);
        } catch (error) {
            console.error('❌ Controller - Error al obtener status:', error);
            return res.status(500).json({
                success: false,
                message: 'Error inesperado al obtener status',
            });
        }
    };
}
