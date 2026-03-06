import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

# Example valid auth token; replace with a valid one as needed
AUTH_TOKEN = "Bearer valid-auth-token"

def test_get_products_filtered_by_category_and_stock():
    headers = {
        "Authorization": AUTH_TOKEN,
        "Accept": "application/json"
    }

    # Step 1: Create a product with a known category and stock > 0 to ensure it appears in filter
    product_payload = {
        "name": "Test Product For Filter",
        "sku": "TPF-001",
        "price": 25.99,
        "stock": 10,
        "category": "test-category-filter"
    }

    created_product_id = None

    try:
        # Create product
        resp_create = requests.post(
            f"{BASE_URL}/products",
            headers={**headers, "Content-Type": "application/json"},
            json=product_payload,
            timeout=TIMEOUT
        )

        assert resp_create.status_code == 201, f"Expected 201 Created for product creation, got {resp_create.status_code}"
        body_create = resp_create.json()
        # Remove status assertions as not specified in PRD
        assert "product_id" in body_create, "Missing product_id in creation response"
        created_product_id = body_create["product_id"]

        # Step 2: Use GET /products with category and in_stock=true filters to retrieve filtered products
        params = {
            "category": product_payload["category"],
            "in_stock": "true"
        }

        resp_get = requests.get(
            f"{BASE_URL}/products",
            headers=headers,
            params=params,
            timeout=TIMEOUT
        )

        assert resp_get.status_code == 200, f"Expected 200 OK for filtered products fetch, got {resp_get.status_code}"
        body_get = resp_get.json()

        # Validate response structure according to PRD (assuming direct response with 'items')
        assert isinstance(body_get, dict), "Expected response body to be a dictionary"
        # Expect 'items' key containing list of products (pagination)
        assert "items" in body_get, "Response missing 'items' key"
        assert isinstance(body_get["items"], list), "'items' should be a list"

        # Verify that at least one product matches our created product with correct category and stock > 0
        matching_products = [
            p for p in body_get["items"]
            if p.get("category") == product_payload["category"] and
            p.get("stock", 0) > 0 and
            p.get("product_id") == created_product_id
        ]

        assert len(matching_products) > 0, "Created product not found in filtered product list"

    finally:
        # Cleanup: delete the created product if created
        if created_product_id:
            try:
                del_resp = requests.delete(
                    f"{BASE_URL}/products/{created_product_id}",
                    headers=headers,
                    timeout=TIMEOUT
                )
                # Deletion might return 200 or 204 depending on API design
                assert del_resp.status_code in [200, 204], f"Failed to delete product, status {del_resp.status_code}"
            except Exception:
                # Ignore errors in cleanup to not mask test errors
                pass

test_get_products_filtered_by_category_and_stock()
