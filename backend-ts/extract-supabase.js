const { Pool } = require('pg');
const fs = require('fs');

const SUPABASE_DB_URL = "postgresql://postgres.hnddcambdbftrehbhetb:YA10eYEACRPZuOvh@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres";

const pool = new Pool({
    connectionString: SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
});

async function extractData() {
    console.log("Starting extraction from Supabase...");
    let sqlOutput = "-- Supabase Data Dump\n\n";

    const tables = [
        { name: 'categories', columns: ['name', 'description'] },
        { name: 'products', columns: ['name', 'category', 'sku', 'stock', 'selling_price', 'cost_price', 'image_url', 'description', 'is_seasonal'] },
        { name: 'calendar_events', columns: ['date', 'title', 'type', 'category', 'description', 'impact_weight', 'is_all_day', 'suggested_impact', 'ai_confidence', 'ai_rationale', 'user_decision', 'calibrated_impact'] },
        { name: 'transactions', columns: ['id', 'total_amount', 'payment_method', 'order_types', 'items_count', 'date'] },
        { name: 'transaction_items', columns: ['transaction_id', 'product_id', 'quantity', 'unit_price', 'subtotal'] }
    ];

    try {
        for (const table of tables) {
            console.log(`Extracting table: ${table.name}...`);
            const { rows } = await pool.query(`SELECT ${table.columns.join(', ')} FROM ${table.name}`);
            
            if (rows.length === 0) {
                console.log(`Table ${table.name} is empty.`);
                continue;
            }

            sqlOutput += `-- Data for ${table.name}\n`;
            for (const row of rows) {
                const columns = Object.keys(row);
                const values = Object.values(row).map(val => {
                    if (val === null) return 'NULL';
                    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                    if (val instanceof Date) return `'${val.toISOString()}'`;
                    return val;
                });
                
                sqlOutput += `INSERT INTO ${table.name} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
            }
            sqlOutput += "\n";
        }

        fs.writeFileSync('scripts/supabase-dump.sql', sqlOutput);
        console.log("Extraction successful! Dump saved to scripts/supabase-dump.sql");
    } catch (err) {
        console.error("Extraction failed:", err);
    } finally {
        await pool.end();
    }
}

extractData();
