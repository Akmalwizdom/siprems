import { Pool } from 'pg';
import { config } from '../config';

// Konfigurasi Pool PostgreSQL lokal
export const pool = new Pool({
    connectionString: config.database.url,
});

// Objek db utama untuk operasi database
export const db = {
    pool,

    // Raw query helper
    async query(text: string, params?: any[]) {
        return pool.query(text, params);
    },

    async querySingle(text: string, params?: any[]) {
        const { rows } = await pool.query(text, params);
        return rows[0] || null;
    },

    transactions: {
        async getAll(limit = 100) {
            const { rows } = await pool.query(
                'SELECT * FROM transactions ORDER BY date DESC LIMIT $1',
                [limit]
            );
            return rows;
        },

        async create(transaction: any) {
            // Menggunakan RPC atomic yang sudah dibuat di init-db.sql
            const { rows } = await pool.query(
                'SELECT public.create_transaction_atomic($1, $2, $3, $4, $5, $6) as result',
                [
                    transaction.total_amount,
                    transaction.payment_method || 'Cash',
                    transaction.order_types || 'dine-in',
                    transaction.items_count || 0,
                    transaction.date || new Date(),
                    JSON.stringify(transaction.items || [])
                ]
            );
            return rows[0].result;
        },
    },

    products: {
        async getAll() {
            const { rows } = await pool.query('SELECT * FROM products ORDER BY name ASC');
            return rows;
        },

        async getById(id: string | number) {
            return db.querySingle('SELECT * FROM products WHERE id = $1', [id]);
        },

        async update(id: string | number, updates: any) {
            const keys = Object.keys(updates);
            if (keys.length === 0) return this.getById(id);

            const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
            const values = Object.values(updates);

            const { rows } = await pool.query(
                `UPDATE products SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
                [id, ...values]
            );
            return rows[0];
        },
    },

    events: {
        async getAll() {
            const { rows } = await pool.query('SELECT * FROM calendar_events ORDER BY date ASC');
            return rows;
        },

        async getById(id: string) {
            return db.querySingle('SELECT * FROM calendar_events WHERE id = $1', [id]);
        },

        async create(event: any) {
            const { rows } = await pool.query(
                'INSERT INTO calendar_events (date, title, type, description, impact_weight) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [event.date, event.title, event.type || 'event', event.description, event.impact_weight || 1.0]
            );
            return rows[0];
        },

        async update(id: string, updates: any) {
            const keys = Object.keys(updates);
            if (keys.length === 0) return this.getById(id);

            const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
            const values = Object.values(updates);

            const { rows } = await pool.query(
                `UPDATE calendar_events SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
                [id, ...values]
            );
            return rows[0];
        },

        async delete(id: string) {
            await pool.query('DELETE FROM calendar_events WHERE id = $1', [id]);
        },
    },
};
