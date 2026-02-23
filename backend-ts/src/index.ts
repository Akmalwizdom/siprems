import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';

const app = express();

// ─── Security Middleware ────────────────────────────────────
// Helmet: Sets various HTTP security headers (XSS, HSTS, etc.)
app.use(helmet());

// CORS: Restrict to allowed origins only (no open wildcard)
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:5173'];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (server-to-server, curl, etc.)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`CORS: Origin ${origin} not allowed`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Rate Limiting: Prevent brute force and DoS attacks
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15-minute window
    max: 200, // Max 200 requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', apiLimiter);

// Stricter rate limit for auth-related endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Max 20 auth attempts per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later' },
});
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

// ─── Body Parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' })); // Allow base64 image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health Check ───────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'siprems-backend-ts',
        timestamp: new Date().toISOString(),
    });
});

// ─── API Routes ─────────────────────────────────────────────
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

app.use('/api/transactions', transactionsRouter);
app.use('/api/products', productsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/calendar/events', eventsRouter); // Alias for Python backend compatibility
app.use('/api/dashboard', dashboardRouter);
app.use('/api/holidays', holidaysRouter);
app.use('/api/forecast', forecastRouter);
app.use('/api/predict', forecastRouter); // Alias for frontend compatibility
app.use('/api/model', forecastRouter); // Alias for model endpoints
app.use('/api/chat', chatRouter);
app.use('/api/users', usersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/categories', categoriesRouter);

// ─── Error Handling ─────────────────────────────────────────
app.use(
    (
        err: Error & { status?: number },
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
    ) => {
        // CORS errors
        if (err.message.startsWith('CORS:')) {
            return res.status(403).json({ error: err.message });
        }

        console.error('[Error]', err.message);

        // In production, don't expose internal error details
        const isProduction = process.env.NODE_ENV === 'production';
        res.status(err.status || 500).json({
            error: isProduction ? 'Internal Server Error' : err.message,
        });
    }
);

// ─── Start Server ───────────────────────────────────────────
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`✅ Backend TS running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔒 CORS origins: ${allowedOrigins.join(', ')}`);
    console.log(`🛡️  Rate limiting: 200 req/15min (API), 20 req/15min (Auth)`);
});

export default app;
