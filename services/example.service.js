import connectMongoDB from '../libs/mongoose.js';
import AppConfig from '../models/AppConfig.js';

export default class ExampleService {
    constructor() {
        connectMongoDB();
    }

    getStatus = async () => {
        try {
            const config = await AppConfig.findOne().lean();

            if (!config) {
                return {
                    success: false,
                    message: 'Configuración no encontrada',
                };
            }

            return {
                success: true,
                message: 'Estado obtenido correctamente',
                data: {
                    status: config.status,
                    appVersion: config.appVersion,
                },
            };
        } catch (error) {
            console.error('❌ Servicio - Error al obtener status:', error);
            return {
                success: false,
                message: 'Error inesperado al obtener status',
            };
        }
    };
}
