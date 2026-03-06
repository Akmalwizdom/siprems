import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { config } from './config';
import { requestIdMiddleware } from './middleware/request-id';
import { logger } from './utils/logger';
import transactionsRouter from './routes/transactions';
import productsRouter from './routes/products';
import eventsRouter from './routes/events';
import dashboardRouter from './routes/dashboard';
import holidaysRouter from './routes/holidays';
import forecastRouter from './routes/forecast';
import chatRouter from './routes/chat';
import usersRouter from './routes/users';
import settingsRouter from './routes/settings';
import categoriesRouter from './routes/categories';
import { globalLimiter } from './middleware/rate-limit';
import { register, httpRequestDurationMicroseconds, httpRequestCount } from './utils/metrics';

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        if (config.security.corsOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increased for base64 image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestIdMiddleware); // Structured logging + request tracing

// Serve static files from public directory
app.use('/uploads', express.static('public/uploads'));

// Metrics Middleware
app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) {
        return next();
    }
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        const route = req.route ? req.route.path : req.path;
        httpRequestCount.inc({
            method: req.method,
            route: route,
            status_code: res.statusCode
        });
        end({
            method: req.method,
            route: route,
            status_code: res.statusCode
        });
    });
    next();
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (ex) {
        res.status(500).end(String(ex));
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'siprems-backend-ts' });
});

function mountCoreRoutes(basePath: string) {
    app.use(`${basePath}/transactions`, transactionsRouter);
    app.use(`${basePath}/products`, productsRouter);
    app.use(`${basePath}/events`, eventsRouter);
    app.use(`${basePath}/dashboard`, dashboardRouter);
    app.use(`${basePath}/holidays`, holidaysRouter);
    app.use(`${basePath}/forecast`, forecastRouter);
    app.use(`${basePath}/chat`, chatRouter);
    app.use(`${basePath}/users`, usersRouter);
    app.use(`${basePath}/settings`, settingsRouter);
    app.use(`${basePath}/categories`, categoriesRouter);
}

// Canonical routes (Phase 2 contract-first)
app.use('/api/v1', globalLimiter);
mountCoreRoutes('/api/v1');

// Backward compatibility routes (max 1 release cycle)
mountCoreRoutes('/api');
app.use('/api/calendar/events', eventsRouter); // Python backend compatibility
app.use('/api/predict', forecastRouter); // Legacy frontend compatibility
app.use('/api/model', forecastRouter); // Legacy model endpoints

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error', {
        requestId: req.requestId,
        errorClass: err.name || 'Error',
        method: req.method,
        path: req.originalUrl,
    });
    res.status(err.status || 500).json({
        status: 'error',
        error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal Server Error' },
    });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
    logger.info('Server started', { port: PORT } as any);
    logger.info(`Health check available at /health`);
});

export default app;
