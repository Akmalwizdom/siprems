import { randomUUID } from 'crypto';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
    requestId?: string;
    userId?: string;
    storeId?: string;
    latencyMs?: number;
    method?: string;
    path?: string;
    statusCode?: number;
    errorClass?: string;
    [key: string]: unknown;
}

/**
 * Structured JSON logger for observability.
 * Each log entry is JSON with: timestamp, level, message, requestId, userId, etc.
 */
class Logger {
    private write(level: LogLevel, message: string, context?: LogContext): void {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...context,
        };
        const output = JSON.stringify(entry);

        switch (level) {
            case 'error':
                process.stderr.write(output + '\n');
                break;
            default:
                process.stdout.write(output + '\n');
                break;
        }
    }

    info(message: string, context?: LogContext): void {
        this.write('info', message, context);
    }

    warn(message: string, context?: LogContext): void {
        this.write('warn', message, context);
    }

    error(message: string, context?: LogContext): void {
        this.write('error', message, context);
    }

    debug(message: string, context?: LogContext): void {
        if (process.env.LOG_LEVEL === 'debug') {
            this.write('debug', message, context);
        }
    }
}

export const logger = new Logger();

/**
 * Generate a unique request ID (UUID v4).
 */
export function generateRequestId(): string {
    return randomUUID();
}
