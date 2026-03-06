import requests
import uuid

BASE_URL = "http://localhost:8000/api/v1"
TIMEOUT = 30

# Normally, this token would be obtained through a proper auth flow
# For test purposes, provide a placeholder or environment variable
FIREBASE_ID_TOKEN = "test-firebase-id-token-placeholder"

def test_list_transactions_for_store():
    headers_auth = {
        "Authorization": f"Bearer {FIREBASE_ID_TOKEN}",
        "Content-Type": "application/json"
    }

    # Step 1: Verify token to get user info and store_id
    verify_token_url = f"{BASE_URL}/auth/verify-token"
    resp = requests.post(verify_token_url, json={"token": FIREBASE_ID_TOKEN}, headers=headers_auth, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Token verification failed: {resp.text}"
    verify_data = resp.json()
    assert "user" in verify_data and "store_id" in verify_data, "Missing user or store_id in token verification response"
    store_id = verify_data["store_id"]

    # Since we must verify atomic transactions, create a new transaction first to ensure data exists for listing
    transactions_url = f"{BASE_URL}/transactions"

    # Prepare a valid transaction payload
    # The structure is inferred and must include cart, payment details, and store_id
    # For atomicity, payment totals must match
    # We'll create a dummy product item and payment info
    cart_item = {
        "product_id": str(uuid.uuid4()),
        "quantity": 2,
        "price": 10.00
    }
    total_amount = cart_item["quantity"] * cart_item["price"]
    payment_details = {
        "method": "cash",
        "amount": total_amount
    }
    transaction_payload = {
        "store_id": store_id,
        "cart": [cart_item],
        "payment": payment_details
    }

    created_transaction_id = None

    try:
        # Create transaction (atomic)
        resp_create = requests.post(transactions_url, json=transaction_payload, headers=headers_auth, timeout=TIMEOUT)
        assert resp_create.status_code == 201, f"Transaction creation failed: {resp_create.text}"
        resp_create_json = resp_create.json()
        assert "transaction_id" in resp_create_json, "Response missing transaction_id"
        created_transaction_id = resp_create_json["transaction_id"]

        # Now, list transactions filtered by this store_id
        params = {"store_id": store_id, "limit": 20}
        resp_list = requests.get(transactions_url, headers=headers_auth, params=params, timeout=TIMEOUT)
        assert resp_list.status_code == 200, f"Listing transactions failed: {resp_list.text}"
        resp_list_json = resp_list.json()

        # Validate response structure contains a list of transactions
        assert isinstance(resp_list_json, dict), "Response is not a JSON object"
        assert "transactions" in resp_list_json, "Response missing 'transactions' key"
        transactions = resp_list_json["transactions"]
        assert isinstance(transactions, list), "'transactions' is not a list"

        # Verify that at least one transaction matches the created one
        matched_txns = [txn for txn in transactions if txn.get("transaction_id") == created_transaction_id]
        assert len(matched_txns) == 1, "Created transaction not found in transactions list"

        # Validate transaction details of the matched transaction
        txn = matched_txns[0]
        assert txn.get("store_id") == store_id, "Transaction store_id mismatch"
        assert "cart" in txn and isinstance(txn["cart"], list) and len(txn["cart"]) > 0, "Transaction cart details missing or invalid"
        assert "payment" in txn and isinstance(txn["payment"], dict), "Transaction payment details missing or invalid"
        # Check atomicity aspects - for example, total amounts match - if present
        # We check that sum of cart item prices*quantity matches payment amount (if these fields exist)
        cart_total_calc = sum(item.get("quantity",0)*item.get("price",0) for item in txn["cart"])
        payment_amount = txn["payment"].get("amount", None)
        assert payment_amount is not None, "Payment amount missing in transaction"
        # Floating point tolerance check
        assert abs(cart_total_calc - payment_amount) < 0.01, "Payment amount does not match cart total"

        # Check standardization and validation hints: Zod validation implies response keys are valid and consistent

    finally:
        # Cleanup: delete the created transaction if API allows delete (not described in PRD, so attempt best effort)
        if created_transaction_id:
            delete_url = f"{transactions_url}/{created_transaction_id}"
            try:
                resp_del = requests.delete(delete_url, headers=headers_auth, timeout=TIMEOUT)
                # Either 200 or 204 expected if deletion supported
                assert resp_del.status_code in (200,204), "Transaction deletion failed"
            except Exception:
                # Log or ignore deletion failure in test context
                pass

test_list_transactions_for_store()