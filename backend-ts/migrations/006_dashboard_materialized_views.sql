-- Drop existing standard views
DROP VIEW IF EXISTS daily_sales_summary CASCADE;
DROP VIEW IF EXISTS category_sales_summary CASCADE;

-- 1. Create Indexes on heavily queried base tables for Query Performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items (transaction_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events (date);

-- 2. Recreate category_sales_summary as a MATERIALIZED VIEW
CREATE MATERIALIZED VIEW category_sales_summary AS
SELECT date(t.date) AS ds,
       p.category,
       sum(ti.subtotal) AS revenue
FROM transaction_items ti
JOIN transactions t ON t.id = ti.transaction_id
JOIN products p ON p.id = ti.product_id
GROUP BY date(t.date), p.category
ORDER BY date(t.date);

-- Require a unique index on the materialized view to allow CONCURRENTLY refreshes
CREATE UNIQUE INDEX IF NOT EXISTS idx_category_sales_summary_ds_category ON category_sales_summary (ds, category);

-- 3. Recreate daily_sales_summary as a MATERIALIZED VIEW
CREATE MATERIALIZED VIEW daily_sales_summary AS
WITH txn AS (
    SELECT date(transactions.date) AS ds,
           sum(transactions.total_amount) AS y,
           count(*) AS transactions_count,
           avg(transactions.total_amount) AS avg_ticket
    FROM transactions
    GROUP BY date(transactions.date)
), items AS (
    SELECT date(t.date) AS ds,
           sum(ti.quantity) AS items_sold
    FROM transaction_items ti
    JOIN transactions t ON t.id = ti.transaction_id
    GROUP BY date(t.date)
), events AS (
    SELECT calendar_events.date AS ds,
           sum(
               CASE
                   WHEN calendar_events.type::text = 'promotion'::text THEN calendar_events.impact_weight
                   ELSE 0::numeric
               END) AS promo_intensity,
           sum(
               CASE
                   WHEN calendar_events.type::text = 'holiday'::text THEN calendar_events.impact_weight
                   ELSE 0::numeric
               END) AS holiday_intensity,
           sum(
               CASE
                   WHEN calendar_events.type::text = 'event'::text THEN calendar_events.impact_weight
                   ELSE 0::numeric
               END) AS event_intensity,
           sum(
               CASE
                   WHEN calendar_events.type::text = 'store-closed'::text THEN calendar_events.impact_weight
                   ELSE 0::numeric
               END) AS closure_intensity
    FROM calendar_events
    GROUP BY calendar_events.date
)
SELECT txn.ds,
       txn.y,
       txn.transactions_count,
       COALESCE(items.items_sold, 0::bigint) AS items_sold,
       txn.avg_ticket,
       EXTRACT(dow FROM txn.ds)::integer AS day_of_week,
       CASE
           WHEN EXTRACT(dow FROM txn.ds)::integer = ANY (ARRAY[0, 6]) THEN 1
           ELSE 0
       END AS is_weekend,
       COALESCE(events.promo_intensity, 0::numeric) AS promo_intensity,
       COALESCE(events.holiday_intensity, 0::numeric) AS holiday_intensity,
       COALESCE(events.event_intensity, 0::numeric) AS event_intensity,
       COALESCE(events.closure_intensity, 0::numeric) AS closure_intensity
FROM txn
LEFT JOIN items ON items.ds = txn.ds
LEFT JOIN events ON events.ds = txn.ds
ORDER BY txn.ds;

-- Require a unique index on the materialized view to allow CONCURRENTLY refreshes
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_sales_summary_ds ON daily_sales_summary (ds);

-- 4. Create a function to manually trigger a refresh of these views
CREATE OR REPLACE FUNCTION refresh_sales_materialized_views()
RETURNS void AS $$
BEGIN
    -- Refreshes concurrently without locking the dashboard read endpoints
    REFRESH MATERIALIZED VIEW CONCURRENTLY category_sales_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;
END;
$$ LANGUAGE plpgsql;
