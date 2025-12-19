import 'dotenv/config';

export const config = {
    port: process.env.PORT || 8000,
    database: {
        url: process.env.DATABASE_URL || '',
    },
    supabase: {
        url: process.env.SUPABASE_URL || '',
        anonKey: process.env.SUPABASE_ANON_KEY || '',
    },
    gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
    },
    mlService: {
        url: process.env.ML_SERVICE_URL || 'http://localhost:8001',
    },
};
