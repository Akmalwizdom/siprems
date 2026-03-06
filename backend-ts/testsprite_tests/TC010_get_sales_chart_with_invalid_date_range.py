import requests

BASE_URL = "http://localhost:8000/api/v1"
HEADERS = {
    "Accept": "application/json",
}

def test_get_sales_chart_with_invalid_date_range():
    url = f"{BASE_URL}/dashboard/sales-chart"
    params = {
        "start": "2026-02-30",
        "end": "2026-02-31"
    }
    try:
        response = requests.get(url, headers=HEADERS, params=params, timeout=30)
        # The API is expected to validate date ranges with Zod and return a standardized error response
        assert response.status_code == 400, f"Expected status code 400, got {response.status_code}"
        data = response.json()
        # Verify error message indicates invalid date range, response standardized
        assert "error" in data or "message" in data, "Expected error info in response"
        err_msg = data.get("error") or data.get("message")
        assert isinstance(err_msg, str), "Error message should be a string"
        # Basic check for date range or invalid date indication in error message
        assert any(keyword in err_msg.lower() for keyword in ["invalid", "date", "range"]), \
            f"Error message does not indicate invalid date range: {err_msg}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_sales_chart_with_invalid_date_range()