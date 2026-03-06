import requests

BASE_URL = "http://localhost:8000/api/v1"
TIMEOUT = 30

# Replace with a valid Firebase ID token before running the test
FIREBASE_ID_TOKEN = "YOUR_VALID_FIREBASE_ID_TOKEN"

def test_event_creation_validation_error():
    headers = {
        "Authorization": f"Bearer {FIREBASE_ID_TOKEN}",
        "Content-Type": "application/json"
    }

    # First, verify the token to get user and store_id
    verify_token_url = f"{BASE_URL}/auth/verify-token"
    verify_payload = {"id_token": FIREBASE_ID_TOKEN}

    try:
        verify_resp = requests.post(verify_token_url, json=verify_payload, headers=headers, timeout=TIMEOUT)
        assert verify_resp.status_code == 200, f"Token verification failed: {verify_resp.text}"
        verify_data = verify_resp.json()
        store_id = verify_data.get("store_id")
        assert store_id, "store_id not found in verify-token response"
    except Exception as e:
        raise AssertionError(f"Authentication step failed: {e}")

    # Prepare event payload missing required field 'start_date' to trigger validation error
    event_payload = {
        "title": "Test Event Missing Start Date",
        # "start_date" is intentionally missing
        "end_date": "2026-03-01T10:00:00Z",
        "type": "promotion",
        "store_id": store_id
    }

    url = f"{BASE_URL}/events"

    try:
        response = requests.post(url, json=event_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise AssertionError(f"Request to create event failed: {e}")

    assert response.status_code == 400, f"Expected 400 validation error, got {response.status_code}"
    resp_json = {}
    try:
        resp_json = response.json()
    except Exception:
        raise AssertionError("Response is not valid JSON")

    # Verify response contains validation error related to missing start_date
    # Assuming standardized error response with details
    errors = resp_json.get("errors") or resp_json.get("error") or resp_json.get("message")
    assert errors, "Validation error details are missing in response"

    # The error message or details should mention 'start_date' missing or required field
    error_text = str(errors).lower()
    assert "start_date" in error_text or "required" in error_text or "missing" in error_text, \
        f"Validation error does not mention missing start_date field: {errors}"


test_event_creation_validation_error()
