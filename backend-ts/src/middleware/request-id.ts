import { Request, Response, NextFunction } from 'express';
import { generateRequestId } from '../utils/logger';
import { logger } from '../utils/logger';

// Extend Express Request to include requestId
declare global {
    namespace Express {
        interface Request {
            requestId?: string;
        }
    }
}

/**
 * Middleware that generates a unique request ID, attaches it to req object
 * and response header, and logs request start/end with latency.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string) || generateRequestId();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const startTime = Date.now();
    const method = req.method;
    const path = req.originalUrl;

    logger.info('Request started', { requestId, method, path });

    // Log completion when response finishes
    res.on('finish', () => {
        const latencyMs = Date.now() - startTime;
        logger.info('Request completed', {
            requestId,
            method,
            path,
            statusCode: res.statusCode,
            latencyMs,
        });
    });

    next();
}
