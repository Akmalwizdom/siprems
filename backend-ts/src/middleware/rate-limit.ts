import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per `window` (here, per minute)
    message: {
        status: 'error',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again after a minute',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
