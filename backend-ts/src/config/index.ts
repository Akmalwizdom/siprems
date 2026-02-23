import 'dotenv/config';

export const config = {
    port: process.env.PORT || 8000,
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
        url: process.env.DATABASE_URL || '',
    },
    supabase: {
        url: process.env.SUPABASE_URL || '',
        anonKey: process.env.SUPABASE_ANON_KEY || '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID || '',
    },
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
    },
    mlService: {
        url: process.env.ML_SERVICE_URL || 'http://localhost:8001',
    },
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173',
    },
};
