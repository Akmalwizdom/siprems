import requests

BASE_URL = "http://localhost:8000"
DASHBOARD_METRICS_ENDPOINT = "/dashboard/metrics"
TIMEOUT = 30

# Replace this with a valid auth token for testing
VALID_AUTH_TOKEN = "Bearer valid_auth_token_example_xyz123"


def test_get_dashboard_metrics_with_auth():
    headers = {
        "Authorization": VALID_AUTH_TOKEN,
        "Accept": "application/json",
    }
    params = {
        "range": "30d"
    }

    try:
        response = requests.get(
            f"{BASE_URL}{DASHBOARD_METRICS_ENDPOINT}",
            headers=headers,
            params=params,
            timeout=TIMEOUT,
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Validate response status code 200
    assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"

    # Validate response JSON structure follows {status, data/error} envelope
    try:
        json_resp = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"

    assert isinstance(json_resp, dict), "Response payload is not a JSON object"
    assert "status" in json_resp, "'status' key is missing in response"
    assert "data" in json_resp or "error" in json_resp, "Response must contain either 'data' or 'error' key"

    # Since this is a success case, error should not be present
    assert "error" not in json_resp, f"Error key found in success response: {json_resp.get('error')}"

    # Status must indicate success (could be "success", "ok", True, or 200 - check typical usage)
    assert json_resp["status"] in ("success", "ok", True, 200), f"Unexpected status value: {json_resp['status']}"

    data = json_resp.get("data")
    assert data is not None, "'data' field is missing in response"

    # Validate expected keys in data for aggregated sales metrics and chart data
    expected_keys = {"total_sales", "revenue_timeseries", "top_products", "stock_alerts"}
    missing_keys = expected_keys - data.keys()
    assert not missing_keys, f"Response data missing expected keys: {missing_keys}"

    # Validate types of some keys as sanity checks (example expectations)
    assert isinstance(data["total_sales"], (int, float)), "'total_sales' should be a number"
    assert isinstance(data["revenue_timeseries"], list), "'revenue_timeseries' should be a list"
    assert isinstance(data["top_products"], list), "'top_products' should be a list"
    assert isinstance(data["stock_alerts"], list), "'stock_alerts' should be a list"


test_get_dashboard_metrics_with_auth()