# 📋 Product Specification Document (PSD)
## SIPREMS - Sistem Prediksi Stok Musiman

**Version:** 1.0  
**Date:** 24 Desember 2025  
**Status:** Final Draft

---

## 1. Product Overview

### 1.1 Product Name
**SIPREMS** — *Smart Inventory Prediction & Recommendation Management System*

### 1.2 Executive Summary
SIPREMS adalah sistem manajemen inventori cerdas yang mengintegrasikan Point of Sale (POS) dengan teknologi Machine Learning (Prophet) untuk memprediksi permintaan stok secara akurat. Sistem ini dirancang khusus untuk membantu UMKM dan retailer mengelola stok dengan lebih efisien melalui analisis data penjualan historis dan faktor musiman.

### 1.3 Problem Statement
| Masalah | Dampak |
|---------|--------|
| **Stockout** | Kehilangan penjualan, pelanggan kecewa |
| **Overstock** | Modal tertahan, risiko expired/rusak |
| **Keputusan Manual** | Tidak berdasarkan data, akurasi rendah |
| **Data Tersebar** | Sulit menganalisis tren dan pola penjualan |

### 1.4 Solution
SIPREMS menyediakan solusi terintegrasi yang menggabungkan:
- ✅ Sistem POS untuk transaksi harian
- ✅ AI/ML Forecasting untuk prediksi demand
- ✅ Rekomendasi restock otomatis
- ✅ Dashboard analytics real-time
- ✅ AI Chatbot untuk bantuan pengguna

---

## 2. Target Users

### 2.1 User Personas

#### Persona 1: Admin/Pemilik Toko
| Attribute | Description |
|-----------|-------------|
| **Role** | Admin |
| **Goals** | Memantau performa bisnis, mengoptimalkan stok, membuat keputusan berbasis data |
| **Pain Points** | Kesulitan memprediksi permintaan, sering kehabisan atau kelebihan stok |
| **Features Used** | Dashboard, Smart Prediction, Manajemen Produk, Settings, User Management |

#### Persona 2: Kasir/Staff
| Attribute | Description |
|-----------|-------------|
| **Role** | Kasir |
| **Goals** | Melakukan transaksi dengan cepat dan akurat |
| **Pain Points** | Interface yang rumit, proses checkout lambat |
| **Features Used** | Transaction POS, Dashboard (view only), Products (view only) |

### 2.2 User Access Matrix (RBAC)

| Fitur | Admin | Kasir |
|-------|:-----:|:-----:|
| Dashboard Analytics | ✅ Full | ✅ Limited |
| Transaksi POS | ✅ | ✅ |
| Manajemen Produk | ✅ CRUD | 👁️ View Only |
| Smart Prediction | ✅ | ❌ |
| Kalender Event | ✅ CRUD | 👁️ View Only |
| User Management | ✅ | ❌ |
| Store Settings | ✅ | ❌ |
| Profile | ✅ | ✅ |

---

## 3. Feature Specifications

### 3.1 Authentication & Authorization

#### FR-001: User Registration
| Attribute | Specification |
|-----------|---------------|
| **Description** | User dapat mendaftar dengan email dan password |
| **Input** | Email, Password, Nama lengkap |
| **Process** | Validasi email unik, hash password via Firebase |
| **Output** | Akun terbuat dengan role default "Kasir" |
| **Priority** | P0 (Critical) |

#### FR-002: User Login
| Attribute | Specification |
|-----------|---------------|
| **Description** | User login dengan email/password |
| **Input** | Email, Password |
| **Process** | Autentikasi via Firebase, generate session token |
| **Output** | Redirect ke Dashboard sesuai role |
| **Priority** | P0 (Critical) |

---

### 3.2 Dashboard Analytics

#### FR-003: Dashboard Overview
| Attribute | Specification |
|-----------|---------------|
| **Description** | Menampilkan ringkasan performa bisnis |
| **Metrics Displayed** | Total Pendapatan, Total Transaksi, Barang Terjual |
| **Filters** | Periode: Hari ini, 7 hari, 30 hari, Custom |
| **Charts** | Sales Performance (Admin), Kategori Teratas, Produk Terlaris |
| **Priority** | P0 (Critical) |

#### FR-004: Low Stock Alert
| Attribute | Specification |
|-----------|---------------|
| **Description** | Menampilkan produk dengan stok di bawah threshold |
| **Threshold** | Stok < 10 unit (configurable) |
| **Display** | Nama produk, stok saat ini, status urgency |
| **Priority** | P1 (High) |

#### FR-005: Search & Notifications
| Attribute | Specification |
|-----------|---------------|
| **Description** | Global search dan notifikasi system |
| **Search Scope** | Produk, Transaksi |
| **Shortcut** | Ctrl+K untuk membuka search |
| **Notifications** | Low stock alerts, event reminders |
| **Priority** | P1 (High) |

---

### 3.3 Product Management

#### FR-006: Product CRUD
| Attribute | Specification |
|-----------|---------------|
| **Create** | Nama, Kategori, Stok, Harga Beli, Harga Jual |
| **Read** | List dengan search, filter, pagination |
| **Update** | Edit semua atribut produk |
| **Delete** | Soft delete dengan konfirmasi |
| **Priority** | P0 (Critical) |

#### FR-007: Product Categories
| Attribute | Specification |
|-----------|---------------|
| **Categories** | Makanan, Minuman, Snack, Rokok, Toiletries, Lainnya |
| **Filtering** | Filter produk berdasarkan kategori |
| **Priority** | P1 (High) |

#### FR-008: Stock Tracking
| Attribute | Specification |
|-----------|---------------|
| **Description** | Real-time stock tracking |
| **Auto Update** | Stok berkurang otomatis saat transaksi |
| **Manual Adjust** | Admin dapat adjust stok manual |
| **Priority** | P0 (Critical) |

---

### 3.4 Transaction POS

#### FR-009: POS Interface
| Attribute | Specification |
|-----------|---------------|
| **Description** | Interface kasir untuk transaksi |
| **Layout** | 2-column: Product grid + Cart |
| **Product Selection** | Click/search untuk add to cart |
| **Quantity** | Adjustable via +/- buttons |
| **Priority** | P0 (Critical) |

#### FR-010: Cart Management
| Attribute | Specification |
|-----------|---------------|
| **Add Item** | Klik produk atau search |
| **Update Qty** | Input manual atau +/- buttons |
| **Remove Item** | Hapus item dari cart |
| **Clear Cart** | Reset semua item |
| **Priority** | P0 (Critical) |

#### FR-011: Checkout Process
| Attribute | Specification |
|-----------|---------------|
| **Subtotal** | Kalkulasi otomatis (price × qty) |
| **Total** | Sum of all subtotals |
| **Payment** | Input nominal pembayaran |
| **Change** | Kalkulasi kembalian otomatis |
| **Receipt** | Generate struk (PDF/Print) |
| **Priority** | P0 (Critical) |

#### FR-012: Transaction History
| Attribute | Specification |
|-----------|---------------|
| **Description** | Riwayat semua transaksi |
| **Data Shown** | ID, tanggal, total, items |
| **Search** | Filter by date range, amount |
| **Export** | PDF dan Excel |
| **Priority** | P1 (High) |

---

### 3.5 Smart Prediction (AI)

#### FR-013: Sales Forecasting
| Attribute | Specification |
|-----------|---------------|
| **Model** | Facebook Prophet |
| **Data Input** | Daily sales summary (min. 30 hari) |
| **Forecast Period** | 30 hari ke depan |
| **Output** | Predicted value + confidence interval |
| **Priority** | P0 (Critical) |

#### FR-014: Prediction Visualization
| Attribute | Specification |
|-----------|---------------|
| **Chart Type** | Line chart dengan area bands |
| **Historical** | Data penjualan aktual |
| **Forecast** | Predicted values (yhat) |
| **Confidence Bands** | Upper & lower bounds |
| **Events Overlay** | Markers untuk holidays/events |
| **Priority** | P0 (Critical) |

#### FR-015: Restock Recommendations
| Attribute | Specification |
|-----------|---------------|
| **Description** | AI-generated restock suggestions |
| **Algorithm** | Compare current stock vs predicted demand |
| **Output** | Produk, jumlah restock, urgency level |
| **Urgency Levels** | High (merah), Medium (kuning), Low (hijau) |
| **Action** | Quick restock button per item |
| **Priority** | P0 (Critical) |

#### FR-016: Model Training
| Attribute | Specification |
|-----------|---------------|
| **Trigger** | Manual atau scheduled |
| **Data Required** | Min. 30 hari transaction data |
| **Parameters** | Adaptive berdasarkan data length |
| **Features** | Trend, weekly seasonality, holidays, events |
| **Priority** | P1 (High) |

---

### 3.6 Calendar & Event Management

#### FR-017: Event Calendar
| Attribute | Specification |
|-----------|---------------|
| **Description** | Kalender interaktif untuk event |
| **Views** | Monthly view |
| **Event Types** | Promo, Holiday, Special Event |
| **Priority** | P1 (High) |

#### FR-018: Event CRUD
| Attribute | Specification |
|-----------|---------------|
| **Create** | Title, date, type, impact factor |
| **Impact Factor** | 1.0 - 2.0 (multiplier untuk prediksi) |
| **Read** | Calendar view + list view |
| **Update/Delete** | Edit atau hapus event |
| **Priority** | P1 (High) |

#### FR-019: Holiday Integration
| Attribute | Specification |
|-----------|---------------|
| **Description** | Integrasi hari libur nasional Indonesia |
| **Source** | Pre-configured + API |
| **Effect** | Otomatis mempengaruhi prediksi |
| **Priority** | P2 (Medium) |

---

### 3.7 User Management (Admin Only)

#### FR-020: User List
| Attribute | Specification |
|-----------|---------------|
| **Description** | Daftar semua user dalam sistem |
| **Data Shown** | Nama, email, role, status, last login |
| **Filters** | By role (Admin/Kasir) |
| **Priority** | P1 (High) |

#### FR-021: User Role Management
| Attribute | Specification |
|-----------|---------------|
| **Description** | Mengubah role user |
| **Roles Available** | Admin, Kasir |
| **Restrictions** | Tidak bisa demote diri sendiri |
| **Priority** | P1 (High) |

---

### 3.8 Store Settings (Admin Only)

#### FR-022: Store Profile
| Attribute | Specification |
|-----------|---------------|
| **Configuration** | Nama toko, alamat, kontak |
| **Logo Upload** | Image upload ke Supabase Storage |
| **Format** | JPG, PNG (max 5MB) |
| **Priority** | P2 (Medium) |

---

### 3.9 User Profile

#### FR-023: Profile Management
| Attribute | Specification |
|-----------|---------------|
| **View** | Nama, email, role, joined date |
| **Update** | Nama, foto profil |
| **Photo Upload** | Image upload ke Supabase Storage |
| **Priority** | P2 (Medium) |

---

### 3.10 AI Chatbot

#### FR-024: AI Assistant
| Attribute | Specification |
|-----------|---------------|
| **Model** | Google Gemini |
| **Context** | Prediction data, store info |
| **Capabilities** | Menjawab pertanyaan seputar prediksi, trend, rekomendasi |
| **Interface** | Floating chat widget |
| **Priority** | P2 (Medium) |

---

## 4. Technical Architecture

### 4.1 System Architecture

```
┌────────────────────────────────────────────────────────────┐
│                      SIPREMS System                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐ │
│  │   Frontend   │◄─►│   Backend    │◄─►│   ML Service   │ │
│  │  React/Vite  │   │  Express.js  │   │ FastAPI/Prophet│ │
│  │  Port: 3000  │   │  Port: 8000  │   │   Port: 8001   │ │
│  └──────────────┘   └──────┬───────┘   └────────────────┘ │
│                            │                               │
│                     ┌──────▼───────┐                       │
│                     │   Supabase   │                       │
│                     │  PostgreSQL  │                       │
│                     │  + Storage   │                       │
│                     │  + Auth      │                       │
│                     └──────────────┘                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 4.2 Technology Stack

#### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build Tool |
| TypeScript | Type Safety |
| Recharts | Charts & Visualizations |
| Shadcn/UI | UI Components |
| Lucide Icons | Iconography |

#### Backend
| Technology | Purpose |
|------------|---------|
| Express.js | REST API |
| TypeScript | Type Safety |
| Supabase Client | Database Operations |
| Google Generative AI | Chatbot (Gemini) |

#### ML Service
| Technology | Purpose |
|------------|---------|
| FastAPI | ML API Server |
| Prophet | Time Series Forecasting |
| Pandas/NumPy | Data Processing |
| Scikit-learn | ML Utilities |

#### Infrastructure
| Technology | Purpose |
|------------|---------|
| Supabase | Database, Auth, Storage |
| Firebase | Authentication |
| Docker | Containerization |

---

## 5. Data Model

### 5.1 Core Entities

```
┌─────────────────┐     ┌─────────────────┐
│     users       │     │    products     │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ email           │     │ name            │
│ name            │     │ category        │
│ role            │     │ stock           │
│ store_id (FK)   │     │ purchase_price  │
│ created_at      │     │ selling_price   │
└─────────────────┘     │ store_id (FK)   │
                        └─────────────────┘
                               │
                               ▼
┌─────────────────┐     ┌─────────────────┐
│  transactions   │     │transaction_items│
├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄───►│ id (PK)         │
│ total           │     │ transaction_id  │
│ store_id (FK)   │     │ product_id (FK) │
│ created_by      │     │ quantity        │
│ created_at      │     │ price           │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│     events      │     │ store_settings  │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ title           │     │ store_name      │
│ date            │     │ logo_url        │
│ type            │     │ address         │
│ impact          │     │ phone           │
│ store_id (FK)   │     └─────────────────┘
└─────────────────┘

┌────────────────────┐
│ daily_sales_summary│  ← Generated for ML
├────────────────────┤
│ ds (date)          │
│ y (total_sales)    │
│ store_id (FK)      │
└────────────────────┘
```

---

## 6. API Endpoints

### 6.1 Backend REST API (Port 8000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/dashboard/summary` | GET | Dashboard metrics |
| `/api/dashboard/notifications` | GET | Notifications & alerts |
| `/api/products` | GET, POST | Product list & create |
| `/api/products/:id` | GET, PUT, DELETE | Product CRUD |
| `/api/transactions` | GET, POST | Transaction operations |
| `/api/transactions/:id` | GET | Transaction detail |
| `/api/forecast/train` | POST | Train ML model |
| `/api/forecast/predict` | POST | Get predictions |
| `/api/events` | GET, POST | Event operations |
| `/api/events/:id` | PUT, DELETE | Event CRUD |
| `/api/holidays` | GET | National holidays |
| `/api/users` | GET, POST | User management |
| `/api/users/:id` | PUT, DELETE | User CRUD |
| `/api/settings` | GET, PUT | Store settings |
| `/api/chat` | POST | AI chatbot |
| `/api/search` | GET | Global search |

### 6.2 ML Service API (Port 8001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ml/train` | POST | Train Prophet model |
| `/ml/predict` | POST | Generate forecast |
| `/ml/model/{store_id}/status` | GET | Model status & metadata |
| `/health` | GET | Health check |

---

## 7. Non-Functional Requirements

### 7.1 Performance
| Metric | Target |
|--------|--------|
| Page Load Time | < 3 seconds |
| API Response Time | < 500ms |
| Prediction Generation | < 10 seconds |
| Model Training | < 60 seconds |

### 7.2 Scalability
| Aspect | Requirement |
|--------|-------------|
| Concurrent Users | Support 50+ simultaneous users |
| Data Volume | Handle 1M+ transactions |
| Model Retraining | Daily scheduled retrain |

### 7.3 Security
| Aspect | Implementation |
|--------|----------------|
| Authentication | Firebase Auth (Email/Password) |
| Authorization | Role-Based Access Control (RBAC) |
| Data Encryption | HTTPS for all communications |
| Storage Security | Supabase RLS policies |

### 7.4 Availability
| Metric | Target |
|--------|--------|
| Uptime | 99% availability |
| Recovery | < 1 hour recovery time |

---

## 8. Success Metrics

### 8.1 Business KPIs
| Metric | Target |
|--------|--------|
| Prediction Accuracy | > 80% (MAPE < 20%) |
| Stockout Reduction | 50% reduction |
| Overstock Reduction | 40% reduction |
| Time Saved | 70% reduction in manual planning |

### 8.2 User Engagement
| Metric | Target |
|--------|--------|
| Daily Active Users | Track adoption rate |
| Feature Usage | Monitor most-used features |
| Prediction Utilization | % of recommendations accepted |

---

## 9. Future Enhancements (Roadmap)

### Phase 2 (Q2 2025)
- [ ] Multi-store support
- [ ] Advanced reporting & analytics
- [ ] Mobile responsive optimization
- [ ] Supplier management integration

### Phase 3 (Q3 2025)
- [ ] Mobile app (React Native)
- [ ] Barcode scanner integration
- [ ] Automated purchase orders
- [ ] Advanced ML models (ensemble methods)

---

## 10. Appendix

### A. Glossary
| Term | Definition |
|------|------------|
| **POS** | Point of Sale - sistem transaksi kasir |
| **Prophet** | Library ML open-source dari Meta untuk time series forecasting |
| **MAPE** | Mean Absolute Percentage Error - metrik akurasi prediksi |
| **RBAC** | Role-Based Access Control - sistem otorisasi berdasarkan role |
| **RLS** | Row Level Security - keamanan data level baris di database |

### B. References
- [Facebook Prophet Documentation](https://facebook.github.io/prophet/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)

---

*Document generated: 24 Desember 2025*  
*Project: SIPREMS - Tugas Technopreneurship*
