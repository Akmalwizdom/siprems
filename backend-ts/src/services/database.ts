import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

const dbApiKey = config.supabase.serviceRoleKey || config.supabase.anonKey;
const hasServiceRoleKey = !!config.supabase.serviceRoleKey && config.supabase.serviceRoleKey.length > 0;

if (!hasServiceRoleKey) {
    console.warn('[Database] WARNING: SUPABASE_SERVICE_ROLE_KEY is not configured.');
    console.warn('[Database] Backend will use anon key and remain affected by RLS policies.');
    console.warn('[Database] For Phase 2 hardening, configure SUPABASE_SERVICE_ROLE_KEY.');
}

// Backend server client. Prefer service role key for trusted server-side access.
export const supabase = createClient(
    config.supabase.url,
    dbApiKey
);

// Admin client for storage operations (same key strategy as supabase client)
export const supabaseAdmin = createClient(
    config.supabase.url,
    dbApiKey
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

        async getById(id: string) {
            const { data, error } = await supabase
                .from('calendar_events')
                .select('*')
                .eq('id', id)
                .single();

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

        async update(id: string, updates: any) {
            const { data, error } = await supabase
                .from('calendar_events')
                .update(updates)
                .eq('id', id)
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
