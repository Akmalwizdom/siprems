import requests
import uuid

BASE_URL = "http://localhost:8000/api/v1"
TIMEOUT = 30

# Replace this with a valid Firebase ID token for authentication
FIREBASE_ID_TOKEN = "YOUR_FIREBASE_ID_TOKEN"

HEADERS = {
    "Authorization": f"Bearer {FIREBASE_ID_TOKEN}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

def test_create_event_and_list_events():
    # Step 1: Verify token to get store_id and user info
    verify_token_url = f"{BASE_URL}/auth/verify-token"
    verify_payload = {"token": FIREBASE_ID_TOKEN}
    verify_resp = requests.post(verify_token_url, headers=HEADERS, json=verify_payload, timeout=TIMEOUT)
    assert verify_resp.status_code == 200, f"Token verification failed: {verify_resp.text}"
    verify_data = verify_resp.json()
    assert "store_id" in verify_data, "store_id not in verification response"
    store_id = verify_data["store_id"]

    event_id = None
    try:
        # Step 2: Create an event with POST /api/v1/events
        create_event_url = f"{BASE_URL}/events"
        # Prepare event payload with required fields according to PRD:
        # title, start_date, end_date, type, store_id
        event_title = f"Test Event {uuid.uuid4()}"
        event_payload = {
            "title": event_title,
            "start_date": "2026-03-01T09:00:00Z",
            "end_date": "2026-03-01T17:00:00Z",
            "type": "promotion",
            "store_id": store_id
        }
        post_resp = requests.post(create_event_url, headers=HEADERS, json=event_payload, timeout=TIMEOUT)
        assert post_resp.status_code == 201, f"Event creation failed: {post_resp.text}"

        post_data = post_resp.json()
        assert "event_id" in post_data, "event_id missing in creation response"
        event_id = post_data["event_id"]
        # Verify standard response fields and Zod validation implied by status 201 and response structure

        # Step 3: List events with GET /api/v1/events?store_id={store_id}
        list_events_url = f"{BASE_URL}/events"
        params = {"store_id": store_id}
        get_resp = requests.get(list_events_url, headers=HEADERS, params=params, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Event listing failed: {get_resp.text}"
        events_list = get_resp.json()
        assert isinstance(events_list, list), "Events list response is not a list"

        # Check that the created event is in the list with correct details
        matching_events = [e for e in events_list if e.get("event_id") == event_id]
        assert len(matching_events) == 1, "Created event not found in event list"
        event = matching_events[0]

        # Validate returned event details match what was created
        assert event.get("title") == event_title, "Event title mismatch"
        assert event.get("start_date") == event_payload["start_date"], "Event start_date mismatch"
        assert event.get("end_date") == event_payload["end_date"], "Event end_date mismatch"
        assert event.get("type") == event_payload["type"], "Event type mismatch"
        assert event.get("store_id") == store_id, "Event store_id mismatch"

    finally:
        # Cleanup: Delete the created event if possible to maintain test isolation
        if event_id is not None:
            delete_url = f"{BASE_URL}/events/{event_id}"
            del_resp = requests.delete(delete_url, headers=HEADERS, timeout=TIMEOUT)
            # It's okay if delete fails here but we can assert 204 or 200 if supported
            # No crash, best effort cleanup
            

test_create_event_and_list_events()