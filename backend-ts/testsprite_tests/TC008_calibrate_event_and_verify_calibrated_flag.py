import requests
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/v1"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json",
    # Add Authentication header if required, e.g.:
    # "Authorization": "Bearer <token>"
}

def test_calibrate_event_and_verify_calibrated_flag():
    # Step 1: Authenticate and get store_id (simulate token verification)
    # Assuming Firebase ID token is required; here we simulate the step
    # Replace 'FAKE_FIREBASE_ID_TOKEN' with an actual token if needed
    auth_token = "FAKE_FIREBASE_ID_TOKEN"
    auth_headers = {**HEADERS, "Authorization": f"Bearer {auth_token}"}
    try:
        auth_resp = requests.post(f"{BASE_URL}/auth/verify-token", headers=auth_headers, json={"token": auth_token}, timeout=TIMEOUT)
        auth_resp.raise_for_status()
        auth_data = auth_resp.json()
        user = auth_data.get("user")
        store_id = auth_data.get("store_id")
        assert store_id, "store_id missing in auth response"
    except Exception as e:
        raise AssertionError(f"Authentication failed: {e}")

    # Step 2: Create an event to calibrate (required if no event_id given)
    event_payload = {
        "title": "Test Calibration Event",
        "start_date": (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d"),
        "end_date": (datetime.utcnow() + timedelta(days=2)).strftime("%Y-%m-%d"),
        "type": "promotion",
        "store_id": store_id
    }
    event_id = None
    try:
        create_resp = requests.post(f"{BASE_URL}/events", headers=auth_headers, json=event_payload, timeout=TIMEOUT)
        create_resp.raise_for_status()
        create_data = create_resp.json()
        event_id = create_data.get("event_id")
        assert event_id, "event_id not returned on event creation"

        # Step 3: POST calibration parameters to the event
        calibration_payload = {
            "impact_multiplier": 1.25
        }
        calibrate_resp = requests.post(f"{BASE_URL}/events/{event_id}/calibrate", headers=auth_headers, json=calibration_payload, timeout=TIMEOUT)
        calibrate_resp.raise_for_status()
        calibrate_data = calibrate_resp.json()
        # Validate standardized response contains calibration status or success indication
        assert "status" in calibrate_data or "message" in calibrate_data, "Calibration response missing expected fields"

        # Step 4: GET events filtered by store_id and verify calibrated flag on the event
        params = {"store_id": store_id}
        list_resp = requests.get(f"{BASE_URL}/events", headers=auth_headers, params=params, timeout=TIMEOUT)
        list_resp.raise_for_status()
        events_data = list_resp.json()
        assert isinstance(events_data, list) or isinstance(events_data.get("events"), list), "Events response missing events list"

        # Normalize list of events
        events_list = events_data if isinstance(events_data, list) else events_data.get("events", [])

        # Find the event by event_id
        matched_events = [e for e in events_list if e.get("event_id") == event_id]
        assert matched_events, f"Event with ID {event_id} not found in events list"
        event = matched_events[0]

        # Check calibrated flag is True or set as expected
        calibrated_flag = event.get("calibrated") or event.get("is_calibrated") or event.get("calibrated_flag")
        assert calibrated_flag is True, "Event calibrated flag is not set to True after calibration"

    finally:
        # Cleanup: delete the created event if it was created
        if event_id:
            try:
                del_resp = requests.delete(f"{BASE_URL}/events/{event_id}", headers=auth_headers, timeout=TIMEOUT)
                # It's OK if deletion fails (e.g. 404), no assertion here
            except Exception:
                pass

test_calibrate_event_and_verify_calibrated_flag()