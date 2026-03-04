-- Phase 2: Atomic transaction creation stored procedure
-- Replaces the 3-step non-atomic insert (transaction → items → stock update)
-- with a single transactional RPC call.
--
-- Features:
-- 1. Single atomic operation: all-or-nothing
-- 2. SELECT ... FOR UPDATE on products to prevent race conditions
-- 3. Rejects if any product stock would go negative
-- 4. Returns the created transaction with items

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
  -- 1. Insert the transaction header
  INSERT INTO transactions (total_amount, payment_method, order_types, items_count, date)
  VALUES (p_total_amount, p_payment_method, p_order_types, p_items_count, p_date)
  RETURNING id INTO v_transaction_id;

  -- 2. Process each item atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item ->> 'product_id')::INTEGER;
    v_quantity := (v_item ->> 'quantity')::INTEGER;

    -- Lock the product row to prevent race conditions
    SELECT stock INTO v_current_stock
    FROM products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with id % not found', v_product_id;
    END IF;

    -- Guard against negative stock
    v_new_stock := v_current_stock - v_quantity;
    IF v_new_stock < 0 THEN
      RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %',
        v_product_id, v_current_stock, v_quantity;
    END IF;

    -- Insert transaction item
    INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, subtotal)
    VALUES (
      v_transaction_id,
      v_product_id,
      v_quantity,
      (v_item ->> 'unit_price')::NUMERIC,
      (v_item ->> 'subtotal')::NUMERIC
    );

    -- Update product stock
    UPDATE products
    SET stock = v_new_stock
    WHERE id = v_product_id;

    -- Accumulate item result
    v_items_result := v_items_result || jsonb_build_object(
      'product_id', v_product_id,
      'quantity', v_quantity,
      'unit_price', (v_item ->> 'unit_price')::NUMERIC,
      'subtotal', (v_item ->> 'subtotal')::NUMERIC,
      'new_stock', v_new_stock
    );
  END LOOP;

  -- 3. Build result
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
