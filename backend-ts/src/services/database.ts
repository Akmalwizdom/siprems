import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Regular client (uses anon key, subject to RLS)
export const supabase = createClient(
    config.supabase.url,
    config.supabase.anonKey
);

// Check if service role key is available
const hasServiceRoleKey = !!config.supabase.serviceRoleKey && config.supabase.serviceRoleKey.length > 0;
if (!hasServiceRoleKey) {
    console.warn('[Database] WARNING: SUPABASE_SERVICE_ROLE_KEY is not configured!');
    console.warn('[Database] supabaseAdmin will fallback to anon key and RLS will apply.');
    console.warn('[Database] This may cause INSERT operations to fail if RLS policies block them.');
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
