import requests
import uuid

BASE_URL = "http://localhost:8000"
EVENTS_ENDPOINT = f"{BASE_URL}/events"
AUTH_TOKEN = "Bearer valid-auth-token-placeholder"  # Replace with valid token if needed
HEADERS = {
    "Authorization": AUTH_TOKEN,
    "Content-Type": "application/json",
    "Accept": "application/json"
}
TIMEOUT = 30

def test_post_events_invalid_date_range_error():
    # Prepare payload with end_date before start_date (invalid date range)
    unique_title = f"Test Event Invalid Date {uuid.uuid4()}"
    payload = {
        "title": unique_title,
        "start_date": "2024-05-10",
        "end_date": "2024-05-09",  # end_date before start_date, invalid
        "metadata": {"description": "Invalid date range test"}
    }

    # POST /events with invalid date range
    try:
        response = requests.post(
            EVENTS_ENDPOINT,
            json=payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Validate response status code 400
    assert response.status_code == 400, f"Expected 400 status, got {response.status_code}"

    # Validate response body error fields {code, message}
    try:
        resp_json = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(resp_json, dict), "Response JSON should be a dict"
    # Check error fields code and message
    assert "code" in resp_json and "message" in resp_json, "Response JSON missing 'code' or 'message' keys"

    # Confirm event was NOT created by searching with GET /events?search={title}
    params = {"search": unique_title}
    try:
        get_response = requests.get(
            EVENTS_ENDPOINT,
            headers=HEADERS,
            params=params,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"GET request failed: {e}"

    # Validate GET /events response 200 and envelope {status, data}
    assert get_response.status_code == 200, f"Expected 200 status, got {get_response.status_code}"
    try:
        get_json = get_response.json()
    except ValueError:
        assert False, "GET /events response not valid JSON"

    assert "status" in get_json, "'status' not in GET response"
    assert get_json["status"] == "success", f"Expected 'success' status, got {get_json['status']}"
    assert "data" in get_json, "'data' not in GET response"
    data = get_json["data"]
    assert isinstance(data, list), "'data' should be a list"

    # The event with title should NOT be in the returned data
    titles = [event.get("title") for event in data if isinstance(event, dict)]
    assert unique_title not in titles, "Event with invalid date range was created, but should not be"

test_post_events_invalid_date_range_error()
