import requests
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 30
AUTH_TOKEN = "Bearer valid_auth_token_example"  # Replace with actual valid token


def test_post_transactions_atomic_creation_success():
    headers = {
        "Authorization": AUTH_TOKEN,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    # Step 1: Create a product to be used in the transaction (required to have stock to decrement)
    product_payload = {
        "name": "Test Product Atomic",
        "sku": "TPA-001",
        "price": 1000,         # price in cents or smallest currency unit
        "stock": 10,
        "category": "Test Category"
    }
    product_id = None
    transaction_id = None
    try:
        # Create product
        resp_product = requests.post(f"{BASE_URL}/products", json=product_payload, headers=headers, timeout=TIMEOUT)
        assert resp_product.status_code == 201, f"Expected 201 Created for product, got {resp_product.status_code}"
        product_data = resp_product.json()
        assert "status" in product_data and product_data["status"] == "success", "Product creation response status not success"
        assert "data" in product_data and "product_id" in product_data["data"], "product_id missing in product creation response"
        product_id = product_data["data"]["product_id"]

        # Step 2: Prepare transaction payload with that product
        transaction_payload = {
            "items": [
                {
                    "product_id": product_id,
                    "quantity": 2
                }
            ],
            "payment": {
                "method": "credit_card",
                "amount": 2000,
                "transaction_reference": "txn-test-atomic-001"
            }
        }

        # Record timestamp before transaction to later verify transaction history
        timestamp_before = int(time.time())

        # Step 3: POST /transactions with valid payload and auth
        resp_transaction = requests.post(f"{BASE_URL}/transactions", json=transaction_payload, headers=headers, timeout=TIMEOUT)
        assert resp_transaction.status_code == 201, f"Expected 201 Created for transaction, got {resp_transaction.status_code}"

        transaction_response = resp_transaction.json()
        # Response envelope must follow {status, data/error} standard
        assert "status" in transaction_response and transaction_response["status"] == "success", "Transaction response status not success"
        assert "data" in transaction_response, "Transaction response missing data field"
        data = transaction_response["data"]
        assert "transaction_id" in data, "transaction_id missing in transaction response data"
        assert "summary" in data, "summary missing in transaction response data"

        transaction_id = data["transaction_id"]

        # Step 4: GET /transactions?transaction_id={transaction_id} to verify full details
        params = {"transaction_id": transaction_id}
        resp_get_trans = requests.get(f"{BASE_URL}/transactions", headers=headers, params=params, timeout=TIMEOUT)
        assert resp_get_trans.status_code == 200, f"Expected 200 OK for getting transaction, got {resp_get_trans.status_code}"

        get_trans_response = resp_get_trans.json()
        assert "status" in get_trans_response and get_trans_response["status"] == "success", "Get transaction response status not success"
        assert "data" in get_trans_response, "Get transaction response missing data"
        details = get_trans_response["data"]
        assert "items" in details and isinstance(details["items"], list) and len(details["items"]) > 0, "Transaction items missing or empty"
        assert any(item["product_id"] == product_id and item["quantity"] == 2 for item in details["items"]), "Transaction items do not include correct product and quantity"
        assert "totals" in details, "Transaction totals missing"
        assert "timestamp" in details, "Transaction timestamp missing"

        # Step 5: GET /products?product_id={product_id} to check stock decrement
        resp_get_product = requests.get(f"{BASE_URL}/products", headers=headers, params={"product_id": product_id}, timeout=TIMEOUT)
        assert resp_get_product.status_code == 200, f"Expected 200 OK for getting product, got {resp_get_product.status_code}"

        get_product_response = resp_get_product.json()
        assert "status" in get_product_response and get_product_response["status"] == "success", "Get product response status not success"
        assert "data" in get_product_response and isinstance(get_product_response["data"], list) and len(get_product_response["data"]) == 1, "Product data missing or invalid"
        product = get_product_response["data"][0]
        expected_stock = product_payload["stock"] - 2
        assert product["stock"] == expected_stock, f"Expected stock {expected_stock} after transaction, got {product['stock']}"

    finally:
        # Cleanup: delete created transaction and product if possible
        # Assuming DELETE endpoints /transactions/{transaction_id} and /products/{product_id} exist (not documented),
        # if not, this step can be omitted or adapted.
        if transaction_id:
            try:
                requests.delete(f"{BASE_URL}/transactions/{transaction_id}", headers=headers, timeout=TIMEOUT)
            except Exception:
                pass
        if product_id:
            try:
                requests.delete(f"{BASE_URL}/products/{product_id}", headers=headers, timeout=TIMEOUT)
            except Exception:
                pass


test_post_transactions_atomic_creation_success()