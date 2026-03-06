import requests

BASE_URL = "http://localhost:8000"
AUTH_TOKEN = "Bearer valid-auth-token"  # Replace with a valid auth token

def test_post_products_creation_success():
    headers = {
        "Authorization": AUTH_TOKEN,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    product_payload = {
        "name": "Test Product TC005",
        "sku": "SKU-TC005-001",
        "price": 19.99,
        "stock": 100,
        "category": "TestCategory"
    }

    product_id = None
    try:
        # Create product
        response = requests.post(
            f"{BASE_URL}/products",
            headers=headers,
            json=product_payload,
            timeout=30
        )
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        response_json = response.json()
        assert "status" in response_json and response_json["status"] == "success", f"Unexpected status envelope: {response_json}"
        assert "data" in response_json, f"Missing data in response: {response_json}"
        assert "product_id" in response_json["data"], f"Missing product_id in response data: {response_json}"
        product_id = response_json["data"]["product_id"]
        assert isinstance(product_id, (str, int)), f"Invalid product_id type: {type(product_id)}"

        # Retrieve product by GET
        get_response = requests.get(
            f"{BASE_URL}/products",
            headers=headers,
            params={"product_id": product_id},
            timeout=30
        )
        assert get_response.status_code == 200, f"Expected 200, got {get_response.status_code}"
        get_json = get_response.json()
        assert "status" in get_json and get_json["status"] == "success", f"Unexpected status envelope: {get_json}"
        assert "data" in get_json, f"Missing data in get response: {get_json}"
        product_data = get_json["data"]
        # The API might return a single object or a list containing one product
        if isinstance(product_data, list):
            assert len(product_data) == 1, f"Expected single product in list, got {len(product_data)}"
            product_data = product_data[0]

        # Validate fields
        assert product_data.get("name") == product_payload["name"], f"Name mismatch: {product_data.get('name')} != {product_payload['name']}"
        assert product_data.get("sku") == product_payload["sku"], f"SKU mismatch: {product_data.get('sku')} != {product_payload['sku']}"
        assert float(product_data.get("price", 0)) == product_payload["price"], f"Price mismatch: {product_data.get('price')} != {product_payload['price']}"
        assert int(product_data.get("stock", -1)) == product_payload["stock"], f"Stock mismatch: {product_data.get('stock')} != {product_payload['stock']}"
        assert product_data.get("category") == product_payload["category"], f"Category mismatch: {product_data.get('category')} != {product_payload['category']}"

    finally:
        if product_id is not None:
            # Cleanup: delete the created product to maintain test isolation
            try:
                del_response = requests.delete(
                    f"{BASE_URL}/products",
                    headers=headers,
                    params={"product_id": product_id},
                    timeout=30
                )
                # It is possible that delete endpoint returns 204 or 200
                assert del_response.status_code in (200, 204), f"Failed to delete product {product_id}, status: {del_response.status_code}"
            except Exception as e:
                # Log error but do not fail test cleanup
                pass

test_post_products_creation_success()