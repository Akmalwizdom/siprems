import requests

BASE_URL = "http://localhost:8000/api/v1"
TIMEOUT = 30

def test_filter_products_by_category_and_stock():
    category = "beverages"
    stock_threshold = 10
    params = {"category": category, "stock_lt": stock_threshold}
    url = f"{BASE_URL}/products"

    try:
        response = requests.get(url, params=params, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to filter products failed: {e}"

    assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate response structure for standardization
    # Assuming standard response structure with keys: success, data, error
    assert "success" in data, "Response missing 'success' field"
    assert "data" in data, "Response missing 'data' field"
    assert "error" in data, "Response missing 'error' field"
    assert data["success"] is True, f"Expected success True but got {data['success']}"
    assert data["error"] is None, f"Expected error None but got {data['error']}"
    assert isinstance(data["data"], list), "'data' should be a list"

    # Validate filtering: all products returned match category and stock < stock_threshold
    for product in data["data"]:
        assert isinstance(product, dict), "Product entry should be a dict"
        # Validate keys expected in product - at least category and stock
        assert "category" in product, "Product missing 'category' field"
        assert "stock" in product, "Product missing 'stock' field"
        # Category match case-insensitive
        assert product["category"].lower() == category.lower(), f"Product category mismatch: expected {category}, got {product['category']}"
        # Stock less than threshold
        assert isinstance(product["stock"], (int, float)), "Product 'stock' must be a number"
        assert product["stock"] < stock_threshold, f"Product stock {product['stock']} is not less than {stock_threshold}"


test_filter_products_by_category_and_stock()