import requests
import uuid
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 30
AUTH_TOKEN = "valid_auth_token_example"  # Replace with a valid token


def create_transaction():
    """Helper to create a transaction for testing purposes."""
    url = f"{BASE_URL}/transactions"
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    # Dummy product and quantity for payload; if inventory is empty, this may need adjustment
    payload = {
        "items": [
            {
                "product_id": "test-product-id-1",
                "quantity": 1
            }
        ],
        "payment": {
            "method": "cash",
            "amount": 10.00
        }
    }

    resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    # If creation failed due to product issues, no transaction to return
    if resp.status_code != 201:
        raise RuntimeError(
            f"Setup transaction creation failed with {resp.status_code}: {resp.text}"
        )
    body = resp.json()
    # Validate direct presence of transaction_id
    transaction_id = body.get("transaction_id")
    assert transaction_id, "transaction_id not found in creation response"
    return transaction_id


def delete_transaction(transaction_id):
    """Helper to delete the transaction after test to keep data clean, if delete supported."""
    url = f"{BASE_URL}/transactions/{transaction_id}"
    headers = {"Authorization": f"Bearer {AUTH_TOKEN}"}
    try:
        resp = requests.delete(url, headers=headers, timeout=TIMEOUT)
        # We do not assert here since not all APIs may support deletion of transactions
    except Exception:
        pass


def test_get_transactions_by_transaction_id():
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Accept": "application/json"
    }

    transaction_id = None
    try:
        # Setup: create a transaction to read
        transaction_id = create_transaction()

        url = f"{BASE_URL}/transactions"
        params = {"transaction_id": transaction_id}

        resp = requests.get(url, headers=headers, params=params, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}, body: {resp.text}"

        body = resp.json()
        # Validate response directly contains expected fields
        assert "transaction_id" in body, "Response missing 'transaction_id' field"
        assert body["transaction_id"] == transaction_id, "Returned transaction_id mismatch"
        assert "items" in body and isinstance(body["items"], list), "'items' missing or invalid in response"
        assert "totals" in body and isinstance(body["totals"], dict), "'totals' missing or invalid in response"
        assert "timestamp" in body and isinstance(body["timestamp"], str), "'timestamp' missing or invalid in response"

    finally:
        if transaction_id:
            delete_transaction(transaction_id)


test_get_transactions_by_transaction_id()
