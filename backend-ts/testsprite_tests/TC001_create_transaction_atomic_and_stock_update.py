import requests
import uuid
import time

BASE_URL = "http://localhost:8000/api/v1"
TIMEOUT = 30
HEADERS_JSON = {"Content-Type": "application/json"}


def test_create_transaction_atomic_and_stock_update():
    # We need a Firebase ID token to authenticate first. As no token was provided,
    # this test cannot proceed without authentication.
    # For demonstration, assume the token is set in environment or here:
    firebase_id_token = "FAKE_FIREBASE_ID_TOKEN_FOR_TESTING"
    auth_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {firebase_id_token}",
    }

    # 1. Verify token, get user and store_id
    verify_token_resp = requests.post(
        f"{BASE_URL}/auth/verify-token",
        json={"token": firebase_id_token},
        headers=HEADERS_JSON,
        timeout=TIMEOUT,
    )
    assert verify_token_resp.status_code == 200, "Token verification failed"
    verify_data = verify_token_resp.json()
    assert "store_id" in verify_data and "user" in verify_data, "Missing store_id or user"
    store_id = verify_data["store_id"]

    # 2. Create a product to transact (atomic transaction needs products with stock)
    product_payload = {
        "name": f"Test Product {uuid.uuid4()}",
        "sku": f"SKU-{uuid.uuid4()}",
        "price": 10.0,
        "stock": 5,
        "category": "test-category",
    }

    product_resp = requests.post(
        f"{BASE_URL}/products",
        json=product_payload,
        headers=auth_headers,
        timeout=TIMEOUT,
    )
    assert product_resp.status_code == 201, "Product creation failed"
    product_data = product_resp.json()
    product_id = product_data.get("product_id")
    assert product_id, "No product_id in response"

    try:
        # 3. Prepare a valid transaction payload that should decrement stock atomically
        quantity_to_buy = 2
        cart_items = [
            {
                "product_id": product_id,
                "quantity": quantity_to_buy,
                "price": product_payload["price"],
            }
        ]
        total_price = product_payload["price"] * quantity_to_buy

        transaction_payload = {
            "store_id": store_id,
            "cart_items": cart_items,
            "payment_details": {
                "method": "cash",
                "amount": total_price,
                "currency": "USD",
            },
            # Optionally: timestamp or user info could be included if supported
        }

        transaction_resp = requests.post(
            f"{BASE_URL}/transactions",
            json=transaction_payload,
            headers=auth_headers,
            timeout=TIMEOUT,
        )
        assert transaction_resp.status_code == 201, "Transaction creation failed"
        transaction_resp_json = transaction_resp.json()
        transaction_id = transaction_resp_json.get("transaction_id")
        assert transaction_id, "transaction_id missing in creation response"

        # 4. Verify stock was decremented correctly
        product_get_resp = requests.get(
            f"{BASE_URL}/products/{product_id}",
            headers=auth_headers,
            timeout=TIMEOUT,
        )
        assert product_get_resp.status_code == 200, "Failed to get product after transaction"
        updated_product = product_get_resp.json()
        expected_stock = product_payload["stock"] - quantity_to_buy
        assert (
            updated_product.get("stock") == expected_stock
        ), f"Stock not decremented correctly: expected {expected_stock}, got {updated_product.get('stock')}"

        # 5. Verify transaction is listed for the store and contains our transaction_id
        list_transactions_resp = requests.get(
            f"{BASE_URL}/transactions",
            headers=auth_headers,
            params={"store_id": store_id, "limit": 20},
            timeout=TIMEOUT,
        )
        assert list_transactions_resp.status_code == 200, "Failed to list transactions"
        transactions_list = list_transactions_resp.json()
        assert any(
            t.get("transaction_id") == transaction_id for t in transactions_list
        ), "Created transaction not found in transaction list"

        # 6. Verify historical transaction data presence for forecasting
        # This is inferred by the presence of the transaction in the get transactions response.
        # Further forecast API calls are beyond this test scope.
        # We ensure the response shape aligns with expected Zod validation by checking keys existence.
        first_transaction = next(
            (t for t in transactions_list if t.get("transaction_id") == transaction_id), None
        )
        assert first_transaction is not None, "Transaction not found in list response"
        # Basic validation of transaction keys (cart_items, payment_details, store_id)
        assert "cart_items" in first_transaction, "Missing cart_items in transaction"
        assert "payment_details" in first_transaction, "Missing payment_details in transaction"
        assert first_transaction["store_id"] == store_id, "Store ID mismatch in transaction"

    finally:
        # Cleanup: Delete created product
        del_resp = requests.delete(
            f"{BASE_URL}/products/{product_id}",
            headers=auth_headers,
            timeout=TIMEOUT,
        )
        assert del_resp.status_code in (200, 204, 404), "Failed to delete product in cleanup"


test_create_transaction_atomic_and_stock_update()
