"""
Generate realistic transaction data for 8-15 December 2025
Minimum 100 transactions per day
"""
import os
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
import uuid

# Load environment variables
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configuration
START_DATE = datetime(2025, 12, 8)
END_DATE = datetime(2025, 12, 15)
MIN_TRANSACTIONS_PER_DAY = 100

# Payment methods with realistic distribution
PAYMENT_METHODS = [
    ("Cash", 0.35),
    ("QRIS", 0.30),
    ("Debit Card", 0.15),
    ("Credit Card", 0.10),
    ("E-Wallet", 0.10)
]

# Order types with realistic distribution
ORDER_TYPES = [
    ("dine-in", 0.50),
    ("takeaway", 0.40),
    ("delivery", 0.10)
]

# Peak hours distribution (realistic coffee shop pattern)
HOUR_WEIGHTS = {
    6: 0.5, 7: 1.5, 8: 3.0, 9: 2.5, 10: 2.0,  # Morning rush
    11: 2.5, 12: 3.0, 13: 2.5, 14: 1.5,       # Lunch rush
    15: 1.8, 16: 2.0, 17: 2.2, 18: 1.5,       # Afternoon
    19: 1.0, 20: 0.8, 21: 0.5                  # Evening
}

def weighted_choice(choices):
    """Choose from list of (value, weight) tuples"""
    weights = [w for _, w in choices]
    return random.choices([v for v, _ in choices], weights=weights)[0]

def get_random_time_in_day(base_date):
    """Generate random time during business hours with realistic distribution"""
    hour = random.choices(list(HOUR_WEIGHTS.keys()), weights=list(HOUR_WEIGHTS.values()))[0]
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return base_date.replace(hour=hour, minute=minute, second=second)

def get_products():
    """Fetch all products from database"""
    try:
        response = supabase.table('products').select('*').execute()
        return response.data
    except Exception as e:
        print(f"Error fetching products: {e}")
        return []

def generate_transaction_items(products, num_items=None):
    """Generate realistic transaction items"""
    if not products:
        return []
    
    # Number of items: weighted towards 1-3 items
    if num_items is None:
        num_items = random.choices([1, 2, 3, 4, 5], weights=[40, 30, 20, 7, 3])[0]
    
    # Select random products (no duplicates for simplicity)
    selected_products = random.sample(products, min(num_items, len(products)))
    
    items = []
    for product in selected_products:
        quantity = random.choices([1, 2, 3], weights=[70, 25, 5])[0]  # Most orders are single quantity
        items.append({
            'product_id': product['id'],
            'product_name': product['name'],
            'quantity': quantity,
            'unit_price': product['selling_price'],
            'subtotal': product['selling_price'] * quantity
        })
    
    return items

def insert_transaction(transaction_date, payment_method, order_type, items):
    """Insert transaction and its items into database"""
    try:
        # Calculate total
        total_amount = sum(item['subtotal'] for item in items)
        items_count = sum(item['quantity'] for item in items)
        
        # Insert transaction
        transaction_data = {
            'date': transaction_date.isoformat(),
            'total_amount': total_amount,
            'payment_method': payment_method,
            'order_types': order_type,
            'items_count': items_count
        }
        
        tx_response = supabase.table('transactions').insert(transaction_data).execute()
        
        if not tx_response.data or len(tx_response.data) == 0:
            print(f"Failed to insert transaction")
            return False
        
        transaction_id = tx_response.data[0]['id']
        
        # Insert transaction items
        items_data = [{
            'transaction_id': transaction_id,
            'product_id': item['product_id'],
            'quantity': item['quantity'],
            'unit_price': item['unit_price'],
            'subtotal': item['subtotal']
        } for item in items]
        
        supabase.table('transaction_items').insert(items_data).execute()
        
        return True
    except Exception as e:
        print(f"Error inserting transaction: {e}")
        return False

def generate_transactions_for_day(date, products, num_transactions):
    """Generate all transactions for a specific day"""
    print(f"\nGenerating {num_transactions} transactions for {date.strftime('%Y-%m-%d')}...")
    
    success_count = 0
    for i in range(num_transactions):
        # Generate random time for this transaction
        transaction_time = get_random_time_in_day(date)
        
        # Select payment method and order type
        payment_method = weighted_choice(PAYMENT_METHODS)
        order_type = weighted_choice(ORDER_TYPES)
        
        # Generate items
        items = generate_transaction_items(products)
        
        # Insert transaction
        if insert_transaction(transaction_time, payment_method, order_type, items):
            success_count += 1
            if (i + 1) % 20 == 0:
                print(f"  Progress: {i + 1}/{num_transactions} transactions created")
    
    print(f"✓ Successfully created {success_count}/{num_transactions} transactions")
    return success_count

def main():
    print("=" * 60)
    print("  Transaction Data Generator")
    print("  Period: Dec 8-15, 2025")
    print("  Target: 100+ transactions/day")
    print("=" * 60)
    
    # Fetch products
    print("\nFetching products from database...")
    products = get_products()
    if not products:
        print("❌ No products found! Please add products first.")
        return
    
    print(f"✓ Found {len(products)} products")
    
    # Generate transactions for each day
    total_transactions = 0
    current_date = START_DATE
    
    while current_date <= END_DATE:
        # Vary the number of transactions per day (100-150 for realism)
        num_transactions = random.randint(MIN_TRANSACTIONS_PER_DAY, 150)
        
        success = generate_transactions_for_day(current_date, products, num_transactions)
        total_transactions += success
        
        current_date += timedelta(days=1)
    
    print("\n" + "=" * 60)
    print(f"  COMPLETED!")
    print(f"  Total transactions created: {total_transactions}")
    print("=" * 60)

if __name__ == "__main__":
    main()
