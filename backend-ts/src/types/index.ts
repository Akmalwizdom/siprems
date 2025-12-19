export interface Transaction {
    id: string;
    transaction_date: string;
    total_amount: number;
    payment_method: string;
    items?: TransactionItem[];
}

export interface TransactionItem {
    id?: string;
    transaction_id?: string;
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    subtotal: number;
}

export interface Product {
    id: string;
    name: string;
    stock: number;
    price: number;
    category?: string;
    reorder_point?: number;
}

export interface CalendarEvent {
    id?: string;
    date: string;
    title: string;
    type: 'promotion' | 'holiday' | 'store-closed' | 'event';
    description?: string;
    impact?: number;
    ai_confidence?: number;
    user_decision?: 'accepted' | 'edited' | 'rejected';
}

export interface Holiday {
    date: string;
    name: string;
    description: string;
    is_national_holiday: boolean;
}

export interface EventClassification {
    category: string;
    confidence: number;
    rationale: string;
}

export interface ForecastRequest {
    store_id: string;
    periods: number;
    events?: CalendarEvent[];
}

export interface ForecastResponse {
    status: 'success' | 'error';
    predictions?: Array<{
        ds: string;
        yhat: number;
        yhat_lower: number;
        yhat_upper: number;
    }>;
    metadata?: any;
    error?: string;
}
