import requests

BASE_URL = "http://localhost:8000/api/v1"
TIMEOUT = 30

# Placeholder for authentication token - replace with valid token if required
AUTH_TOKEN = "your_firebase_id_token_here"

def test_get_dashboard_metrics_for_date_range():
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    # First, verify token to get store_id
    verify_token_url = f"{BASE_URL}/auth/verify-token"
    resp_verify = requests.post(verify_token_url, json={"token": AUTH_TOKEN}, headers=headers, timeout=TIMEOUT)
    assert resp_verify.status_code == 200, f"Token verification failed: {resp_verify.text}"
    user_data = resp_verify.json()
    assert "store_id" in user_data, "store_id missing in token verify response"
    store_id = user_data["store_id"]

    # Prepare parameters with a valid date range
    params = {
        "store_id": store_id,
        "start": "2026-01-01",
        "end": "2026-01-31"
    }

    metrics_url = f"{BASE_URL}/dashboard/metrics"

    # Call GET /dashboard/metrics with valid date range
    resp = requests.get(metrics_url, headers=headers, params=params, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Expected 200 OK, got {resp.status_code}: {resp.text}"

    response_json = resp.json()

    # Basic validation of expected fields in response (aggregated metrics)
    assert isinstance(response_json, dict), "Response is not a JSON object"
    # Example expected keys based on PRD: sales, avg_ticket, top_products
    expected_keys = {"sales", "avg_ticket", "top_products"}
    missing_keys = expected_keys - response_json.keys()
    assert not missing_keys, f"Missing expected keys in response: {missing_keys}"

    # Validate types for keys (basic checks)
    assert isinstance(response_json["sales"], (int, float)), "sales should be a number"
    assert isinstance(response_json["avg_ticket"], (int, float)), "avg_ticket should be a number"
    assert isinstance(response_json["top_products"], list), "top_products should be a list"

    # Additional checks can be added here to verify Zod validation and response standardization if spec provided

test_get_dashboard_metrics_for_date_range()