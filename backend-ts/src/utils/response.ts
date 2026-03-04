import { Response } from 'express';

/**
 * Standard success response envelope.
 * Format: { status: 'success', data, meta? }
 */
export function sendSuccess(res: Response, data: unknown, meta?: Record<string, unknown>, httpStatus = 200): void {
    const body: Record<string, unknown> = { status: 'success', data };
    if (meta && Object.keys(meta).length > 0) {
        body.meta = meta;
    }
    res.status(httpStatus).json(body);
}

/**
 * Standard error response envelope.
 * Format: { status: 'error', error: { code, message, details? } }
 */
export function sendError(
    res: Response,
    code: string,
    message: string,
    httpStatus = 500,
    details?: unknown,
): void {
    const errorBody: Record<string, unknown> = { code, message };
    if (details !== undefined) {
        errorBody.details = details;
    }
    res.status(httpStatus).json({
        status: 'error',
        error: errorBody,
    });
}
