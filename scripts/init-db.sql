-- Skrip Inisialisasi Database SIPREMS (Versi Lengkap Hasil Audit Supabase)
-- Dikonsolidasikan dari migrasi Supabase 001-007

-- Ekstensi yang diperlukan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabel Kategori
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Produk
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT REFERENCES categories(name) ON UPDATE CASCADE,
    sku TEXT UNIQUE,
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    selling_price NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
    cost_price NUMERIC(15,2) DEFAULT 0 CHECK (cost_price >= 0),
    image_url TEXT,
    description TEXT,
    is_seasonal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel User (Firebase Auth Sync)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Transaksi
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    payment_method TEXT DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'QRIS', 'Debit Card', 'Credit Card', 'E-Wallet')),
    order_types TEXT DEFAULT 'dine-in' CHECK (order_types IN ('dine-in', 'takeaway', 'delivery')),
    items_count INTEGER DEFAULT 0 CHECK (items_count >= 0),
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Item Transaksi
CREATE TABLE IF NOT EXISTS transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(15,2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Kalender Event (Lengkap dengan kolom AI/ML)
CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'event' CHECK (type IN ('promotion', 'holiday', 'store-closed', 'event')),
    category TEXT,
    description TEXT,
    impact_weight NUMERIC(3,2) DEFAULT 1.0 CHECK (impact_weight >= 0 AND impact_weight <= 2.0),
    is_all_day BOOLEAN DEFAULT true,
    suggested_impact NUMERIC(3,2),
    ai_confidence NUMERIC(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1.0),
    ai_rationale TEXT,
    user_decision TEXT CHECK (user_decision IN ('accepted', 'edited', 'rejected', 'pending')),
    calibrated_impact NUMERIC(3,2),
    last_calibration_date TIMESTAMPTZ,
    calibration_count INTEGER DEFAULT 0,
    suggested_category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Pengaturan Toko
CREATE TABLE IF NOT EXISTS store_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    name TEXT DEFAULT '',
    address TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabel ML & Forecasting (Metrik & Cache)
CREATE TABLE IF NOT EXISTS sales_forecasts (
    store_id TEXT NOT NULL,
    date DATE NOT NULL,
    forecast NUMERIC NOT NULL,
    lower_bound NUMERIC,
    upper_bound NUMERIC,
    model_version TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (store_id, date)
);

CREATE TABLE IF NOT EXISTS ml_model_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    version TEXT NOT NULL,
    accuracy DOUBLE PRECISION,
    mape DOUBLE PRECISION,
    y_mean DOUBLE PRECISION,
    y_std DOUBLE PRECISION,
    data_points INTEGER,
    training_time_seconds DOUBLE PRECISION,
    quality_report JSONB,
    parameters JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ml_drift_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id TEXT NOT NULL,
    drift_score DOUBLE PRECISION,
    actual_mape DOUBLE PRECISION,
    period_start DATE,
    period_end DATE,
    data_drift_detected BOOLEAN DEFAULT false,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabel Kalibrasi Event & Clustering
CREATE TABLE IF NOT EXISTS event_clusters (
    id SERIAL PRIMARY KEY,
    cluster_name TEXT NOT NULL UNIQUE,
    cluster_type TEXT,
    avg_impact NUMERIC,
    keywords TEXT[],
    event_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_cluster_members (
    event_id INTEGER NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    cluster_id INTEGER NOT NULL REFERENCES event_clusters(id) ON DELETE CASCADE,
    similarity_score NUMERIC,
    PRIMARY KEY (event_id, cluster_id)
);

CREATE TABLE IF NOT EXISTS event_calibration_history (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    previous_impact NUMERIC,
    new_impact NUMERIC,
    actual_sales NUMERIC,
    baseline_sales NUMERIC,
    observed_effect NUMERIC,
    method TEXT DEFAULT 'exponential_smoothing',
    notes TEXT,
    calibration_date TIMESTAMPTZ DEFAULT NOW()
);

-- Insert data default
INSERT INTO store_settings (id, name) VALUES (1, 'SIPREMS Store') ON CONFLICT DO NOTHING;
INSERT INTO users (firebase_uid, email, role, display_name)
VALUES ('dmwdYgcnsXT9KkkSFDPMttNgI3w1', 'faiqihya@gmail.com', 'admin', 'Mas Admin')
ON CONFLICT DO NOTHING;

-- 10. Fungsi & Trigger Automasi Updated At
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON store_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_clusters_updated_at BEFORE UPDATE ON event_clusters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Stored Procedure: Transaksi Atomik (create_transaction_atomic)
CREATE OR REPLACE FUNCTION public.create_transaction_atomic(
  p_total_amount NUMERIC,
  p_payment_method TEXT DEFAULT 'Cash',
  p_order_types TEXT DEFAULT 'dine-in',
  p_items_count INTEGER DEFAULT 0,
  p_date TIMESTAMPTZ DEFAULT NOW(),
  p_items JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_item JSONB;
  v_product_id INTEGER;
  v_quantity INTEGER;
  v_current_stock INTEGER;
  v_new_stock INTEGER;
  v_result JSONB;
  v_items_result JSONB := '[]'::JSONB;
BEGIN
  INSERT INTO transactions (total_amount, payment_method, order_types, items_count, date)
  VALUES (p_total_amount, p_payment_method, p_order_types, p_items_count, p_date)
  RETURNING id INTO v_transaction_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item ->> 'product_id')::INTEGER;
    v_quantity := (v_item ->> 'quantity')::INTEGER;

    SELECT stock INTO v_current_stock FROM products WHERE id = v_product_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produk dengan id % tidak ditemukan', v_product_id;
    END IF;

    v_new_stock := v_current_stock - v_quantity;
    IF v_new_stock < 0 THEN
      RAISE EXCEPTION 'Stok tidak mencukupi untuk produk %. Tersedia: %, Diminta: %',
        v_product_id, v_current_stock, v_quantity;
    END IF;

    INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, subtotal)
    VALUES (v_transaction_id, v_product_id, v_quantity, (v_item ->> 'unit_price')::NUMERIC, (v_item ->> 'subtotal')::NUMERIC);

    UPDATE products SET stock = v_new_stock WHERE id = v_product_id;

    v_items_result := v_items_result || jsonb_build_object(
      'product_id', v_product_id,
      'quantity', v_quantity,
      'unit_price', (v_item ->> 'unit_price')::NUMERIC,
      'subtotal', (v_item ->> 'subtotal')::NUMERIC,
      'new_stock', v_new_stock
    );
  END LOOP;

  v_result := jsonb_build_object(
    'transaction_id', v_transaction_id,
    'total_amount', p_total_amount,
    'payment_method', p_payment_method,
    'order_types', p_order_types,
    'items_count', p_items_count,
    'date', p_date,
    'items', v_items_result
  );

  RETURN v_result;
END;
$$;

-- 12. Fungsi Validasi Integritas Data
CREATE OR REPLACE FUNCTION public.validate_data_integrity()
RETURNS TABLE(check_name text, status text, details text)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check 1: Orphaned transaction items
    RETURN QUERY
    SELECT 
        'Orphaned Items'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' transaction items without valid transactions'::TEXT
    FROM transaction_items ti
    LEFT JOIN transactions t ON ti.transaction_id = t.id
    WHERE t.id IS NULL;
    
    -- Check 2: Products with negative stock
    RETURN QUERY
    SELECT 
        'Negative Stock'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' products with negative stock'::TEXT
    FROM products
    WHERE stock < 0;
    
    -- Check 3: Transactions with mismatched totals
    RETURN QUERY
    SELECT 
        'Transaction Totals'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*)::TEXT || ' transactions with mismatched item totals'::TEXT
    FROM transactions t
    LEFT JOIN (
        SELECT transaction_id, SUM(subtotal) AS calculated_total
        FROM transaction_items
        GROUP BY transaction_id
    ) items ON t.id = items.transaction_id
    WHERE ABS(t.total_amount - COALESCE(items.calculated_total, 0)) > 0.01;
    
    RETURN;
END;
$$;

-- 13. Indeks Performa
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items (transaction_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events (date);

-- 14. Materialized Views untuk Dashboard
CREATE MATERIALIZED VIEW category_sales_summary AS
SELECT date(t.date) AS ds, p.category, sum(ti.subtotal) AS revenue
FROM transaction_items ti
JOIN transactions t ON t.id = ti.transaction_id
JOIN products p ON p.id = ti.product_id
GROUP BY date(t.date), p.category;

CREATE UNIQUE INDEX IF NOT EXISTS idx_category_sales_summary_ds_category ON category_sales_summary (ds, category);

CREATE MATERIALIZED VIEW daily_sales_summary AS
WITH txn AS (
    SELECT date(date) AS ds, sum(total_amount) AS y, count(*) AS transactions_count, avg(total_amount) AS avg_ticket
    FROM transactions GROUP BY date(date)
), items AS (
    SELECT date(t.date) AS ds, sum(ti.quantity) AS items_sold
    FROM transaction_items ti JOIN transactions t ON t.id = ti.transaction_id GROUP BY date(t.date)
), events AS (
    SELECT date AS ds,
           sum(CASE WHEN type = 'promotion' THEN impact_weight ELSE 0 END) AS promo_intensity,
           sum(CASE WHEN type = 'holiday' THEN impact_weight ELSE 0 END) AS holiday_intensity,
           sum(CASE WHEN type = 'event' THEN impact_weight ELSE 0 END) AS event_intensity,
           sum(CASE WHEN type = 'store-closed' THEN impact_weight ELSE 0 END) AS closure_intensity
    FROM calendar_events GROUP BY date
)
SELECT txn.ds, txn.y, txn.transactions_count, COALESCE(items.items_sold, 0) AS items_sold, txn.avg_ticket,
       EXTRACT(dow FROM txn.ds)::integer AS day_of_week,
       CASE WHEN EXTRACT(dow FROM txn.ds)::integer IN (0, 6) THEN 1 ELSE 0 END AS is_weekend,
       COALESCE(events.promo_intensity, 0) AS promo_intensity,
       COALESCE(events.holiday_intensity, 0) AS holiday_intensity,
       COALESCE(events.event_intensity, 0) AS event_intensity,
       COALESCE(events.closure_intensity, 0) AS closure_intensity
FROM txn
LEFT JOIN items ON items.ds = txn.ds
LEFT JOIN events ON events.ds = txn.ds;

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_sales_summary_ds ON daily_sales_summary (ds);


-- Fungsi Refresh Materialized View
CREATE OR REPLACE FUNCTION refresh_sales_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY category_sales_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;
END;
$$ LANGUAGE plpgsql;
