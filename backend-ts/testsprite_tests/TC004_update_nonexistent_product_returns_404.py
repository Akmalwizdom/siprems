import requests

BASE_URL = "http://localhost:8000/api/v1"
TIMEOUT = 30

# Replace with a valid Firebase ID token for authentication
FIREBASE_ID_TOKEN = "your_valid_firebase_id_token_here"

def update_nonexistent_product_returns_404():
    nonexistent_product_id = "00000000-0000-0000-0000-000000000000"  # Assumed non-existent UUID
    url = f"{BASE_URL}/products/{nonexistent_product_id}"

    headers = {
        "Authorization": f"Bearer {FIREBASE_ID_TOKEN}",
        "Content-Type": "application/json"
    }

    update_payload = {
        "name": "Updated Name",
        "price": 9.99
    }

    try:
        response = requests.patch(url, json=update_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 404, (
        f"Expected status code 404, got {response.status_code}, response body: {response.text}"
    )

    if response.text.strip():
        try:
            json_resp = response.json()
        except ValueError:
            assert False, "Response is not valid JSON"

        # Check error or message field
        assert "error" in json_resp or "message" in json_resp, "Response JSON missing 'error' or 'message' field"

        err_msg = json_resp.get("error") or json_resp.get("message") or ""
        assert "not found" in err_msg.lower(), f"Error message does not indicate not found: {err_msg}"
    else:
        # If no content, consider it acceptable for 404
        pass

update_nonexistent_product_returns_404()
