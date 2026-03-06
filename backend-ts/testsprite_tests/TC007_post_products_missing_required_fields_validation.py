import requests

BASE_URL = "http://localhost:8000"
PRODUCTS_ENDPOINT = f"{BASE_URL}/products/"
HEADERS = {
    "Authorization": "Bearer valid_auth_token",
    "Content-Type": "application/json",
}
TIMEOUT = 30

def test_post_products_missing_required_fields_validation():
    invalid_product_payload = {
        # "name" is missing intentionally to trigger validation error
        "sku": "TESTSKU123",
        "price": 19.99,
        "stock": 10,
        "category": "Test Category"
    }

    # Attempt to create product with missing required field 'name'
    response = requests.post(PRODUCTS_ENDPOINT, json=invalid_product_payload, headers=HEADERS, timeout=TIMEOUT)
    
    # Validate response status code 422 (validation error)
    assert response.status_code == 422, f"Expected status 422, got {response.status_code}"
    json_resp = response.json()

    # Expect json_resp to contain validation error details about missing 'name' field
    # This might be a dict of errors or an array, so check content flexibly
    errors_found = False
    if isinstance(json_resp, dict):
        # Flatten stringified errors for search
        response_text = str(json_resp).lower()
        if 'name' in response_text:
            errors_found = True
    assert errors_found, "Response validation errors must mention missing 'name' field"

    # Verify no product was created by searching for the SKU with GET /products?search=TESTSKU123
    search_params = {"search": "TESTSKU123"}
    get_response = requests.get(PRODUCTS_ENDPOINT, headers=HEADERS, params=search_params, timeout=TIMEOUT)
    assert get_response.status_code == 200, f"Expected 200 on GET products, got {get_response.status_code}"
    get_json = get_response.json()
    # Assume get_json has list of products directly or nested in 'data'
    products = []
    if isinstance(get_json, dict) and "data" in get_json and isinstance(get_json["data"], list):
        products = get_json["data"]
    elif isinstance(get_json, list):
        products = get_json

    # Confirm no product with sku 'TESTSKU123' exists
    for product in products:
        if isinstance(product, dict) and "sku" in product:
            assert product["sku"] != "TESTSKU123", "Product with invalid creation SKU found, rollback failed"

test_post_products_missing_required_fields_validation()
