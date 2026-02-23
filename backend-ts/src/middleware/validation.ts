import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

interface ValidationError {
    field: string;
    message: string;
    code: string;
}

function formatZodErrors(error: ZodError): ValidationError[] {
    return error.issues.map((issue: ZodIssue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
    }));
}

/**
 * Validation middleware factory using Zod schemas.
 * 
 * Validates request body against a Zod schema and returns
 * structured validation errors on failure. The validated
 * data replaces req.body for downstream handlers.
 * 
 * @example
 * ```ts
 * const CreateProductSchema = z.object({
 *   name: z.string().min(1).max(200),
 *   price: z.number().positive(),
 *   stock: z.number().int().nonnegative(),
 * });
 * 
 * router.post('/', authenticate, validate(CreateProductSchema), handler);
 * ```
 */
export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: formatZodErrors(error),
                });
            }
            next(error);
        }
    };
}

/**
 * Validate query parameters
 */
export function validateQuery(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const validated = schema.parse(req.query);
            // Merge validated back — query stays as ParsedQs-compatible
            Object.assign(req.query, validated);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    error: 'Invalid query parameters',
                    details: formatZodErrors(error),
                });
            }
            next(error);
        }
    };
}

/**
 * Validate URL params  
 */
export function validateParams(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.params = schema.parse(req.params) as Record<string, string>;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    error: 'Invalid URL parameters',
                    details: formatZodErrors(error),
                });
            }
            next(error);
        }
    };
}
