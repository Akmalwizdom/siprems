import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Generic Zod validation middleware factory.
 * Validates `req.body` against the provided schema.
 * On failure, returns a standardized 400 error with field-level details.
 */
export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const fieldErrors = result.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
                code: issue.code,
            }));

            res.status(400).json({
                status: 'error',
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Request validation failed',
                    details: fieldErrors,
                },
            });
            return;
        }

        // Replace req.body with parsed (and defaulted) values
        req.body = result.data;
        next();
    };
}
