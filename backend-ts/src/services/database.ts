import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Main client used by routes. 
// SECURITY: We use the service role key here so the backend can bypass RLS.
// This allows us to lock down the database for public/anon access while the
// backend continues to function. The backend handles its own RBAC (admin/user).
export const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey || config.supabase.anonKey
);

// Check if service role key is available
const hasServiceRoleKey = !!config.supabase.serviceRoleKey && config.supabase.serviceRoleKey.length > 0;
if (!hasServiceRoleKey) {
    console.error('[Database] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!');
    console.error('[Database] RLS policies will block all backend operations if they are enabled.');
}

// Admin client for storage operations (uses service role key, bypasses RLS)
export const supabaseAdmin = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey || config.supabase.anonKey
);

// Helper function for common database operations
export const db = {
    supabase, // Export for direct access in routes

    transactions: {
        async getAll(limit = 100) {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('transaction_date', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        },

        async create(transaction: any) {
            const { data, error } = await supabase
                .from('transactions')
                .insert(transaction)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
    },

    products: {
        async getAll() {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name');

            if (error) throw error;
            return data;
        },

        async getById(id: string) {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        },

        async update(id: string, updates: any) {
            const { data, error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
    },

    events: {
        async getAll() {
            const { data, error } = await supabase
                .from('calendar_events')
                .select('*')
                .order('date');

            if (error) throw error;
            return data;
        },

        async create(event: any) {
            const { data, error } = await supabase
                .from('calendar_events')
                .insert(event)
                .select()
                .single();

            if (error) throw error;
            return data;
        },

        async delete(id: string) {
            const { error } = await supabase
                .from('calendar_events')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
    },
};
