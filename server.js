import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fileUpload from 'express-fileupload';
import path from 'path';

import ExampleRoutes from './routes/exampleRoutes.js';
import companiesRoutes from './routes/companies.routes.js';
import usersRoutes from './routes/users.routes.js';
import businessUnitsRoutes from './routes/businessUnits.routes.js';
import teamsRoutes from './routes/teams.routes.js';
import productsRoutes from './routes/products.routes.js';
import leadsRoutes from './routes/leads.routes.js';
import leadEventsRoutes from './routes/leadEvents.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import rankingRoutes from './routes/ranking.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import importsRoutes from './routes/imports.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { startJobs } from './jobs/index.js';

dotenv.config();

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');

// Seguridad: Headers de seguridad HTTP
app.use(helmet());

// Seguridad: Rate limiting global (100 requests per 15 minutes)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    message: 'Demasiadas solicitudes, intenta más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

// Seguridad: Rate limiting estricto para autenticación (10 requests per 15 minutes)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10,
    message: 'Demasiados intentos de login, intenta más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS bloqueado'), false);
    },
    credentials: true,
}));

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: './tmp',
    createParentPath: true,
}));

app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Rutas de ejemplo y módulos CRM
app.use('/api/example', ExampleRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/business-units', businessUnitsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/lead-events', leadEventsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/imports', importsRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', adminRoutes);

// Middleware global de manejo de errores (debe ir al final)
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en http://0.0.0.0:${PORT}`);
    startJobs();
});
