import { Request, Response, NextFunction } from 'express';

/**
 * In-memory idempotency store with TTL cleanup.
 * In production, replace with Redis for multi-instance support.
 */
interface CachedResponse {
    statusCode: number;
    body: unknown;
    createdAt: number;
}

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const idempotencyStore = new Map<string, CachedResponse>();

// Periodic cleanup of expired entries (every hour)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of idempotencyStore.entries()) {
        if (now - entry.createdAt > IDEMPOTENCY_TTL_MS) {
            idempotencyStore.delete(key);
        }
    }
}, 60 * 60 * 1000);

/**
 * Idempotency middleware.
 * Reads `Idempotency-Key` header. If present and seen before,
 * returns the cached response. Otherwise, intercepts res.json()
 * to cache the response for future duplicate requests.
 */
export function idempotency(req: Request, res: Response, next: NextFunction): void {
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

    if (!idempotencyKey) {
        // No key provided — proceed normally
        return next();
    }

    // Check for existing cached response
    const cached = idempotencyStore.get(idempotencyKey);
    if (cached) {
        res.status(cached.statusCode).json(cached.body);
        return;
    }

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
        idempotencyStore.set(idempotencyKey, {
            statusCode: res.statusCode,
            body,
            createdAt: Date.now(),
        });
        return originalJson(body);
    };

    next();
}
