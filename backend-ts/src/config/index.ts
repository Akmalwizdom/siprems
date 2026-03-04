import 'dotenv/config';

function parseCsv(rawValue: string | undefined): string[] {
    if (!rawValue) {
        return [];
    }

    return rawValue
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

const defaultCorsOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
];

const configuredCorsOrigins = parseCsv(process.env.CORS_ORIGIN_ALLOWLIST);
const corsOrigins = configuredCorsOrigins.length > 0 ? configuredCorsOrigins : defaultCorsOrigins;

export const config = {
    port: process.env.PORT || 8000,
    database: {
        url: process.env.DATABASE_URL || '',
    },
    supabase: {
        url: process.env.SUPABASE_URL || '',
        anonKey: process.env.SUPABASE_ANON_KEY || '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
    },
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        webApiKey: process.env.FIREBASE_WEB_API_KEY || '',
        serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
        serviceAccountClientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        serviceAccountPrivateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    security: {
        corsOrigins,
        chatRateLimitWindowMs: Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS || 60_000),
        chatRateLimitMaxRequests: Number(process.env.CHAT_RATE_LIMIT_MAX_REQUESTS || 30),
    },
    mlService: {
        url: process.env.ML_SERVICE_URL || 'http://localhost:8001',
    },
};
