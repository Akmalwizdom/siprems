import requests
from datetime import datetime, timedelta
import calendar

BASE_URL = "http://localhost:8000"
AUTH_TOKEN = "Bearer valid_auth_token_example_here"  # Replace with a valid token

HEADERS = {
    "Authorization": AUTH_TOKEN,
    "Content-Type": "application/json"
}

def test_post_events_creation_success():
    # Prepare payload with title, start_date, end_date, metadata
    today = datetime.utcnow().date()
    start_date = today + timedelta(days=1)
    end_date = start_date + timedelta(days=2)
    title = "Test Event TC008"
    metadata = {"type": "promotion", "special": True}

    payload = {
        "title": title,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "metadata": metadata
    }

    event_id = None
    try:
        # POST /events to create new event
        response = requests.post(
            f"{BASE_URL}/events",
            headers=HEADERS,
            json=payload,
            timeout=30
        )
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        resp_json = response.json()
        # Validate envelope format
        assert "status" in resp_json, "Missing 'status' in response"
        assert resp_json["status"] == "success", "Expected status 'success'"
        assert "data" in resp_json, "Missing 'data' in response"
        data = resp_json["data"]
        assert "event_id" in data, "Missing event_id in response data"
        event_id = data["event_id"]
        assert isinstance(event_id, (int, str)), "event_id should be int or str"

        # Extract the month param as YYYY-MM for GET /events?month=YYYY-MM
        month_str = start_date.strftime("%Y-%m")
        # GET /events filtered by month to confirm presence
        response_get = requests.get(
            f"{BASE_URL}/events",
            headers=HEADERS,
            params={"month": month_str},
            timeout=30
        )
        assert response_get.status_code == 200, f"Expected 200, got {response_get.status_code}"
        resp_get_json = response_get.json()
        # Validate envelope format
        assert "status" in resp_get_json, "Missing 'status' in GET response"
        assert resp_get_json["status"] == "success", "Expected status 'success' in GET response"
        assert "data" in resp_get_json, "Missing 'data' in GET response"
        data_list = resp_get_json["data"]
        assert isinstance(data_list, list), "'data' in GET response should be a list"

        # Confirm the newly created event is in the list filtered by month
        matching_events = [e for e in data_list if str(e.get("event_id")) == str(event_id)]
        assert len(matching_events) == 1, "Created event not found in GET /events by month"

        # Additional validation of event fields in found event (optional)
        event = matching_events[0]
        assert event.get("title") == title, "Event title mismatch"
        assert event.get("start_date") == start_date.isoformat(), "Event start_date mismatch"
        assert event.get("end_date") == end_date.isoformat(), "Event end_date mismatch"
        assert event.get("metadata") == metadata, "Event metadata mismatch"

    finally:
        if event_id:
            # Cleanup: delete the event created
            try:
                response_del = requests.delete(
                    f"{BASE_URL}/events/{event_id}",
                    headers=HEADERS,
                    timeout=30
                )
                # It is okay if the delete fails, just ensure no exception thrown
            except Exception:
                pass

test_post_events_creation_success()