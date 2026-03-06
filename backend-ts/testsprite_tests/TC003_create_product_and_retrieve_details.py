import requests
import uuid

BASE_URL = "http://localhost:8000/api/v1"
TIMEOUT = 30


def test_create_product_and_retrieve_details():
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer fake-token"
    }

    product_payload = {
        "name": f"Test Product {uuid.uuid4()}",
        "sku": f"SKU-{uuid.uuid4()}",
        "price": 19.99,
        "stock": 100,
        "category": "test-category",
        "store_id": str(uuid.uuid4())  # Assuming store_id is required and a UUID string
    }

    product_id = None

    try:
        # Create new product
        create_resp = requests.post(
            f"{BASE_URL}/products",
            json=product_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 201, f"Expected 201 Created, got {create_resp.status_code}"
        create_data = create_resp.json()
        assert "product_id" in create_data, "Response missing product_id"
        product_id = create_data["product_id"]
        # Validate Zod-based schema keys at least exist (basic verification)
        for key in ["name", "sku", "price", "stock", "category", "store_id"]:
            assert key in product_payload, f"Payload missing expected field {key}"

        # Retrieve created product details
        get_resp = requests.get(
            f"{BASE_URL}/products/{product_id}",
            headers=headers,
            timeout=TIMEOUT,
        )
        assert get_resp.status_code == 200, f"Expected 200 OK on get product, got {get_resp.status_code}"
        product_data = get_resp.json()

        # Validate returned product details
        assert product_data.get("product_id") == product_id, "Returned product_id mismatch"
        assert product_data.get("name") == product_payload["name"], "Product name mismatch"
        assert product_data.get("sku") == product_payload["sku"], "Product SKU mismatch"
        assert product_data.get("price") == product_payload["price"], "Product price mismatch"
        assert product_data.get("stock") == product_payload["stock"], "Product stock mismatch"
        assert product_data.get("category") == product_payload["category"], "Product category mismatch"
        assert product_data.get("store_id") == product_payload["store_id"], "Product store_id mismatch"

    finally:
        # Clean up: delete the created product if it exists
        if product_id is not None:
            try:
                del_resp = requests.delete(
                    f"{BASE_URL}/products/{product_id}",
                    headers=headers,
                    timeout=TIMEOUT,
                )
                # Could be 200, 204 or 404 if already deleted
                assert del_resp.status_code in (200, 204, 404), f"Unexpected status code on delete: {del_resp.status_code}"
            except Exception:
                pass


test_create_product_and_retrieve_details()
