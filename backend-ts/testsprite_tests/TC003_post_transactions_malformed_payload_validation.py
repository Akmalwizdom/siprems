import requests
import time

BASE_URL = "http://localhost:8000"
HEADERS = {
    # Example auth header, update with valid token if required
    "Authorization": "Bearer valid_auth_token",
    "Content-Type": "application/json",
    "Accept": "application/json"
}
TIMEOUT = 30

def test_post_transactions_malformed_payload_validation():
    malformed_payload = {
        # 'items' field is missing intentionally to cause validation error
        "payment_info": {
            "method": "credit_card",
            "card_number": "4111111111111111",
            "expiry": "12/25",
            "cvv": "123"
        }
    }

    # Get timestamp before the test to confirm no partial writes afterward
    timestamp_before = int(time.time())

    # POST malformed payload to /transactions
    response = requests.post(
        f"{BASE_URL}/transactions",
        headers=HEADERS,
        json=malformed_payload,
        timeout=TIMEOUT
    )

    # Validate 422 response with proper error envelope
    assert response.status_code == 422, f"Expected 422, got {response.status_code}"
    resp_json = response.json()
    assert "status" in resp_json, "Response missing 'status'"
    assert resp_json["status"] == "error", "Expected status 'error'"
    assert "error" in resp_json, "Response missing 'error'"
    error_info = resp_json["error"]
    assert isinstance(error_info, dict), "'error' should be an object"
    # Expect validation error mentioning 'items'
    assert any(
        "items" in str(val).lower() for val in error_info.values()
    ), "Validation error should mention missing 'items' field"

    # Verify no partial transaction was created by querying recent transactions
    params = {
        "recent": "true"
    }
    get_response = requests.get(
        f"{BASE_URL}/transactions",
        headers=HEADERS,
        params=params,
        timeout=TIMEOUT
    )

    assert get_response.status_code == 200, f"GET /transactions failed with {get_response.status_code}"
    get_json = get_response.json()
    assert "status" in get_json, "GET response missing 'status'"
    assert get_json["status"] == "success", "GET response status not 'success'"
    assert "data" in get_json, "GET response missing 'data'"
    recent_transactions = get_json["data"]
    # recent_transactions should be a list
    assert isinstance(recent_transactions, list), "'data' should be a list"
    # None of the recent transactions should have timestamp after timestamp_before (no new record)
    for txn in recent_transactions:
        txn_ts = txn.get("timestamp") or txn.get("created_at") or 0
        # timestamp might be ISO string or epoch, attempt to parse epoch int
        try:
            txn_epoch = int(txn_ts)
        except Exception:
            # ignore parsing errors, assume no transaction added
            txn_epoch = 0
        assert txn_epoch <= timestamp_before, "Found transaction created after malformed request, rollback failed"


test_post_transactions_malformed_payload_validation()
