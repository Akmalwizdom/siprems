import { API_BASE_URL } from '../config';

// ============================================================
// Shared types (aligned with openapi.yaml schemas)
// ============================================================

export interface Product {
  id: number;
  name: string;
  category: string;
  sku?: string | null;
  stock: number;
  selling_price: number;
  cost_price?: number | null;
  image_url?: string | null;
  description?: string | null;
  created_at: string;
}

export interface CreateProductInput {
  name: string;
  category: string;
  sku?: string;
  stock?: number;
  selling_price: number;
  cost_price?: number;
  image_url?: string | null;
  description?: string | null;
}

export interface UpdateProductInput {
  stock?: number;
  price?: number;
  name?: string;
  category?: string;
  selling_price?: number;
  cost_price?: number;
  description?: string | null;
}

export interface TransactionItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface CreateTransactionInput {
  items: TransactionItem[];
  total_amount: number;
  payment_method?: string;
  order_types?: string;
  items_count?: number;
}

export interface Transaction {
  id: string;
  total_amount: number;
  payment_method: string;
  order_types: string;
  items_count: number;
  date: string;
  created_at: string;
  items?: TransactionItem[];
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: 'promotion' | 'holiday' | 'store-closed' | 'event';
  description?: string | null;
  impact_weight: number;
}

export interface CreateEventInput {
  date: string;
  title: string;
  type?: string;
  description?: string | null;
  impact_weight?: number;
}

export interface ChatMessage {
  message: string;
  predictionData?: Record<string, unknown> | null;
  chatHistory?: { role: string; content: string }[];
}

export interface User {
  id: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface StoreSettings {
  name: string;
  address: string;
  phone: string;
  logo_url: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface Holiday {
  date: string;
  name: string;
  type: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalTransactions: number;
  totalItemsSold: number;
  revenueChange: number;
  transactionsChange: number;
  itemsChange: number;
}

export interface SalesChartEntry {
  date: string;
  sales: number;
  transactions_count: number;
}

export interface CategorySalesEntry {
  category: string;
  value: number;
  color: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface SuccessEnvelope<T = unknown> {
  status: 'success';
  data: T;
  meta?: Record<string, unknown>;
}

export interface ErrorEnvelope {
  status: 'error';
  error: { code: string; message: string; details?: unknown[] };
}

// ============================================================
// HTTP helpers
// ============================================================

function createHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(errorText || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// ============================================================
// Typed API client
// ============================================================

export const openApiClient = {
  // ---------- Products ----------
  async listProducts(
    params?: { page?: number; limit?: number; search?: string; category?: string },
    token?: string,
  ): Promise<PaginatedResponse<Product>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.category) qs.set('category', params.category);
    const response = await fetch(`${API_BASE_URL}/products?${qs}`, {
      headers: createHeaders(token),
    });
    return parseJsonResponse<PaginatedResponse<Product>>(response);
  },

  async createProduct(payload: CreateProductInput, token: string) {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: createHeaders(token),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse<SuccessEnvelope<Product>>(response);
  },

  async updateProduct(id: number, payload: UpdateProductInput, token: string) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PATCH',
      headers: createHeaders(token),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse<SuccessEnvelope<Product>>(response);
  },

  async deleteProduct(id: number, token: string) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: createHeaders(token),
    });
    return parseJsonResponse<{ status: string; message: string }>(response);
  },

  // ---------- Transactions ----------
  async listTransactions(
    params?: { page?: number; limit?: number; startDate?: string; endDate?: string },
    token?: string,
  ): Promise<SuccessEnvelope<{ transactions: Transaction[]; total: number }>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.startDate) qs.set('startDate', params.startDate);
    if (params?.endDate) qs.set('endDate', params.endDate);
    const response = await fetch(`${API_BASE_URL}/transactions?${qs}`, {
      headers: createHeaders(token),
    });
    return parseJsonResponse(response);
  },

  async createTransaction(
    payload: CreateTransactionInput,
    token: string,
    idempotencyKey?: string,
  ) {
    const headers = createHeaders(token);
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    return parseJsonResponse<SuccessEnvelope<Transaction>>(response);
  },

  // ---------- Events ----------
  async listEvents(): Promise<CalendarEvent[]> {
    const response = await fetch(`${API_BASE_URL}/events`);
    return parseJsonResponse<CalendarEvent[]>(response);
  },

  async createEvent(payload: CreateEventInput, token: string) {
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: createHeaders(token),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse<SuccessEnvelope<CalendarEvent>>(response);
  },

  async updateEvent(id: string, payload: CreateEventInput, token: string) {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'PUT',
      headers: createHeaders(token),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse<SuccessEnvelope<CalendarEvent>>(response);
  },

  async deleteEvent(id: string, token: string) {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'DELETE',
      headers: createHeaders(token),
    });
    return parseJsonResponse<{ status: string; message: string }>(response);
  },

  // ---------- Dashboard ----------
  async getDashboardMetrics(range?: string): Promise<DashboardMetrics> {
    const qs = range ? `?range=${range}` : '';
    const response = await fetch(`${API_BASE_URL}/dashboard/metrics${qs}`);
    return parseJsonResponse<DashboardMetrics>(response);
  },

  async getSalesChart(): Promise<SalesChartEntry[]> {
    const response = await fetch(`${API_BASE_URL}/dashboard/sales-chart`);
    return parseJsonResponse<SalesChartEntry[]>(response);
  },

  async getCategorySales(): Promise<CategorySalesEntry[]> {
    const response = await fetch(`${API_BASE_URL}/dashboard/category-sales`);
    return parseJsonResponse<CategorySalesEntry[]>(response);
  },

  // ---------- Chat ----------
  async sendChatMessage(payload: ChatMessage, token: string) {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: createHeaders(token),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse<SuccessEnvelope<{ reply: string }>>(response);
  },

  // ---------- Users ----------
  async getMe(token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: createHeaders(token),
    });
    return parseJsonResponse<User>(response);
  },

  async updateMe(payload: { display_name?: string; avatar_url?: string }, token: string) {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: createHeaders(token),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse<User>(response);
  },

  async listUsers(
    params?: { page?: number; limit?: number; search?: string },
    token?: string,
  ): Promise<PaginatedResponse<User>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    const response = await fetch(`${API_BASE_URL}/users?${qs}`, {
      headers: createHeaders(token),
    });
    return parseJsonResponse<PaginatedResponse<User>>(response);
  },

  async updateUserRole(userId: string, role: 'user' | 'admin', token: string) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
      method: 'PUT',
      headers: createHeaders(token),
      body: JSON.stringify({ role }),
    });
    return parseJsonResponse<{ message: string; user: User }>(response);
  },

  async deleteUser(userId: string, token: string) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: createHeaders(token),
    });
    return parseJsonResponse<{ message: string }>(response);
  },

  // ---------- Settings ----------
  async getStoreSettings(): Promise<{ status: string; data: StoreSettings }> {
    const response = await fetch(`${API_BASE_URL}/settings/store`);
    return parseJsonResponse(response);
  },

  async updateStoreSettings(payload: StoreSettings, token: string) {
    const response = await fetch(`${API_BASE_URL}/settings/store`, {
      method: 'PUT',
      headers: createHeaders(token),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse(response);
  },

  // ---------- Categories ----------
  async listCategories(): Promise<{ status: string; categories: Category[] }> {
    const response = await fetch(`${API_BASE_URL}/categories`);
    return parseJsonResponse(response);
  },

  async createCategory(payload: { name: string; description?: string }, token: string) {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: createHeaders(token),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse(response);
  },

  async updateCategory(id: number, payload: { name?: string; description?: string }, token: string) {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PATCH',
      headers: createHeaders(token),
      body: JSON.stringify(payload),
    });
    return parseJsonResponse(response);
  },

  async deleteCategory(id: number, token: string) {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: createHeaders(token),
    });
    return parseJsonResponse<{ status: string; message: string }>(response);
  },

  // ---------- Holidays ----------
  async getHolidaysForYear(year: number) {
    const response = await fetch(`${API_BASE_URL}/holidays/${year}`);
    return parseJsonResponse<{ status: string; year: number; count: number; holidays: Holiday[] }>(response);
  },

  async getHolidaysForMonth(year: number, month: number) {
    const response = await fetch(`${API_BASE_URL}/holidays/${year}/${month}`);
    return parseJsonResponse<{ status: string; year: number; month: number; count: number; holidays: Holiday[] }>(response);
  },

  // ---------- Forecast ----------
  async getForecast(days?: number, token?: string) {
    const qs = days ? `?days=${days}` : '';
    const response = await fetch(`${API_BASE_URL}/forecast${qs}`, {
      headers: createHeaders(token),
    });
    return parseJsonResponse(response);
  },

  async getModelStatus(storeId: string, token: string): Promise<{
    status: string;
    model: {
      exists: boolean;
      accuracy: number | null;
      last_trained: string | null;
      data_points: number | null;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/forecast/model/${storeId}/status`, {
      headers: createHeaders(token),
    });
    return parseJsonResponse(response);
  },
};
