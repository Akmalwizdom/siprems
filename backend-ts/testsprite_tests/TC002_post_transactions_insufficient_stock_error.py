import requests
import time

def test_post_transactions_insufficient_stock_error():
    BASE_URL = "http://localhost:8000"
    AUTH_TOKEN = "Bearer YOUR_VALID_AUTH_TOKEN"  # Replace with a valid token

    HEADERS = {
        "Authorization": AUTH_TOKEN,
        "Content-Type": "application/json"
    }

    # Step 1: Fetch a product with known stock to craft a cart exceeding stock
    products_resp = requests.get(f"{BASE_URL}/products?in_stock=true", headers=HEADERS, timeout=30)
    assert products_resp.status_code == 200, f"Failed to list products: {products_resp.text}"
    products = products_resp.json()
    assert isinstance(products, list), f"Expected a list of products but got: {products}"
    assert products, "No products available with stock for testing"

    product = products[0]
    product_id = product.get("product_id")
    available_stock = product.get("stock")
    assert product_id is not None, "Product ID missing"
    assert isinstance(available_stock, int), "Invalid stock value"

    # Prepare cart with quantity greater than available stock
    requested_qty = available_stock + 10 if available_stock >= 0 else 1
    cart_payload = {
        "items": [
            {
                "product_id": product_id,
                "quantity": requested_qty
            }
        ],
        "payment": {
            "method": "credit_card",
            "amount": 0  # amount is dummy, focus is stock validation
        }
    }

    # Record timestamp before POST /transactions attempt
    timestamp_before = int(time.time())

    # Step 2: POST /transactions with over-quantity cart expecting 400 error with insufficient_stock code
    post_resp = requests.post(f"{BASE_URL}/transactions", headers=HEADERS, json=cart_payload, timeout=30)
    assert post_resp.status_code == 400, f"Expected 400 response, got {post_resp.status_code}"
    resp_json = post_resp.json()
    error = resp_json.get("error")
    assert error is not None, "Error object missing in response"
    assert error.get("code") == "insufficient_stock", f"Expected error code 'insufficient_stock', got: {error.get('code')}"
    details = error.get("details")
    assert details is not None, "Error details missing"
    assert details.get("product_id") == product_id, "Error details product_id mismatch"
    assert details.get("available") == available_stock, "Error details available stock mismatch"
    assert details.get("requested") == requested_qty, "Error details requested quantity mismatch"

    # Step 3: Confirm no transaction created by checking GET /transactions since timestamp_before
    get_params = {"since": timestamp_before}
    get_resp = requests.get(f"{BASE_URL}/transactions", headers=HEADERS, params=get_params, timeout=30)
    assert get_resp.status_code == 200, f"Failed to list transactions: {get_resp.text}"
    transactions = get_resp.json()
    assert isinstance(transactions, list), f"Expected a list of transactions but got: {transactions}"

    for txn in transactions:
        txn_time = txn.get("timestamp") or txn.get("created_at") or 0
        if isinstance(txn_time, str):
            # Attempt to parse ISO8601 or timestamp string to int timestamp, skip if fail
            try:
                from dateutil.parser import parse as date_parse
                import calendar
                dt = date_parse(txn_time)
                txn_time = calendar.timegm(dt.utctimetuple())
            except Exception:
                txn_time = 0
        assert txn_time < timestamp_before, "New transaction found despite insufficient stock error"

test_post_transactions_insufficient_stock_error()
