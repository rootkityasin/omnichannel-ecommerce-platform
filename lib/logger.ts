export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    tenantId?: string;
    context?: Record<string, any>;
    error?: string;
}

class Logger {
    private isDev = process.env.NODE_ENV === 'development';

    private format(entry: LogEntry): string {
        if (this.isDev) {
            const parts = [
                `[${entry.timestamp}]`,
                entry.level.toUpperCase(),
                entry.tenantId ? `(Tenant: ${entry.tenantId})` : '',
                entry.message,
            ].filter(Boolean);

            return parts.join(' ');
        }
        return JSON.stringify(entry);
    }

    log(level: LogLevel, message: string, context?: Record<string, any>, tenantId?: string) {
        const entry: LogEntry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            tenantId,
            context,
        };

        if (context?.error instanceof Error) {
            entry.error = context.error.message;
            // Keep stack in context for dev, simplify for JSON unless needed
            if (this.isDev) {
                console.error(context.error);
            }
        }

        const output = this.format(entry);

        switch (level) {
            case 'debug': console.debug(output); break;
            case 'info': console.info(output); break;
            case 'warn': console.warn(output); break;
            case 'error': console.error(output); break;
        }
    }

    info(message: string, context?: Record<string, any>, tenantId?: string) { this.log('info', message, context, tenantId); }
    warn(message: string, context?: Record<string, any>, tenantId?: string) { this.log('warn', message, context, tenantId); }
    error(message: string, error?: unknown, context?: Record<string, any>, tenantId?: string) {
        this.log('error', message, { ...context, error }, tenantId);
    }
}

export const logger = new Logger();
