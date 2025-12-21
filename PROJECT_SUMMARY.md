# 📊 SIPREMS - Sistem Prediksi Stok Musiman

## **Smart Inventory Prediction & Recommendation Management System**

> Sistem prediksi stok musiman terintegrasi dengan POS (Point of Sale) menggunakan model Prophet untuk forecasting permintaan

---

## 📋 Deskripsi Proyek

**SIPREMS** adalah sebuah sistem manajemen inventori cerdas yang menggabungkan:
- **Sistem POS (Point of Sale)** untuk transaksi harian
- **Machine Learning (Prophet)** untuk prediksi stok musiman
- **Dashboard Analytics** untuk monitoring bisnis real-time
- **Rekomendasi Restock Otomatis** berdasarkan prediksi AI

Sistem ini dirancang untuk membantu pemilik usaha retail/UMKM dalam mengelola stok dengan lebih efisien, mengurangi risiko kehabisan stok (stockout) atau kelebihan stok (overstock) dengan memanfaatkan analisis data penjualan historis dan faktor musiman.

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                        SIPREMS Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│   │  Frontend   │◄──►│  Backend    │◄──►│    ML Service       │  │
│   │  React/Vite │    │  Express.js │    │  FastAPI + Prophet  │  │
│   │  Port: 3000 │    │  Port: 8000 │    │    Port: 8001       │  │
│   └─────────────┘    └──────┬──────┘    └─────────────────────┘  │
│                             │                                     │
│                             ▼                                     │
│                    ┌─────────────────┐                           │
│                    │    Supabase     │                           │
│                    │   PostgreSQL    │                           │
│                    │   + Storage     │                           │
│                    └─────────────────┘                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Komponen Utama:

| Komponen | Teknologi | Port | Deskripsi |
|----------|-----------|------|-----------|
| **Frontend** | React + Vite + TypeScript | 3000 | UI/UX modern dengan dashboard interaktif |
| **Backend** | Express.js + TypeScript | 8000 | REST API & business logic |
| **ML Service** | FastAPI + Python | 8001 | Model Prophet untuk prediksi |
| **Database** | Supabase (PostgreSQL) | - | Penyimpanan data + Authentication |

---

## 🛠️ Tech Stack

### Frontend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| React | 18.3.1 | UI Library |
| Vite | 6.3.5 | Build Tool & Dev Server |
| TypeScript | - | Type Safety |
| Recharts | 2.15.2 | Data Visualization |
| MUI (Material-UI) | 7.3.6 | UI Components |
| Lucide React | 0.487.0 | Icons |
| Firebase | 12.6.0 | Authentication |
| jsPDF | 3.0.4 | PDF Export |
| xlsx | 0.18.5 | Excel Export |

### Backend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Express.js | 4.21.2 | Web Framework |
| TypeScript | 5.7.2 | Type Safety |
| Supabase JS | 2.47.10 | Database Client |
| Axios | 1.7.9 | HTTP Client |
| Google Generative AI | 0.21.0 | AI Chatbot (Gemini) |

### ML Service
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| FastAPI | 0.115.6 | Web Framework |
| Prophet | 1.1.6 | Time Series Forecasting |
| Pandas | 2.2.3 | Data Manipulation |
| NumPy | 1.26.4 | Numerical Computing |
| Scikit-learn | 1.5.2 | ML Utilities |
| SQLAlchemy | 2.0.36 | ORM |

---

## 📁 Struktur Proyek

```
siprems-cd/
├── 📂 src/                          # Frontend Source Code
│   ├── 📂 pages/                    # Halaman Aplikasi
│   │   ├── Dashboard.tsx            # Dashboard utama
│   │   ├── Products.tsx             # Manajemen produk
│   │   ├── Transaction.tsx          # Transaksi POS
│   │   ├── SmartPrediction.tsx      # Halaman prediksi AI
│   │   ├── CalendarImproved.tsx     # Kalender event
│   │   ├── Settings.tsx             # Pengaturan toko
│   │   ├── Profile.tsx              # Profil pengguna
│   │   ├── UserManagement.tsx       # Manajemen user (Admin)
│   │   ├── Login.tsx                # Halaman login
│   │   └── Register.tsx             # Halaman registrasi
│   │
│   ├── 📂 components/               # Komponen Reusable
│   │   ├── PredictionChartSVG.tsx   # Chart prediksi
│   │   ├── RestockModal.tsx         # Modal restock
│   │   ├── ChatBot.tsx              # AI Chatbot
│   │   ├── Loader.tsx               # Loading animation
│   │   └── 📂 ui/                   # UI primitives
│   │
│   ├── 📂 context/                  # React Context
│   │   └── AuthContext.tsx          # Authentication state
│   │
│   ├── 📂 services/                 # API Services
│   └── 📂 utils/                    # Utility functions
│
├── 📂 backend-ts/                   # Backend TypeScript
│   ├── 📂 src/
│   │   ├── index.ts                 # Entry point
│   │   ├── config.ts                # Konfigurasi
│   │   ├── 📂 routes/               # API Routes
│   │   │   ├── transactions.ts      # CRUD transaksi
│   │   │   ├── products.ts          # CRUD produk
│   │   │   ├── forecast.ts          # Endpoint prediksi
│   │   │   ├── dashboard.ts         # Data dashboard
│   │   │   ├── events.ts            # Kalender event
│   │   │   ├── holidays.ts          # Hari libur nasional
│   │   │   ├── users.ts             # Manajemen user
│   │   │   ├── settings.ts          # Pengaturan toko
│   │   │   └── chat.ts              # AI Chatbot
│   │   │
│   │   ├── 📂 services/             # Business Logic
│   │   └── 📂 middleware/           # Auth middleware
│   │
│   └── 📂 migrations/               # Database migrations
│
├── 📂 ml-service/                   # ML Service Python
│   ├── main.py                      # FastAPI entry point
│   ├── model_trainer.py             # Prophet model training
│   ├── predictor.py                 # Prediction logic
│   ├── config.py                    # ML configurations
│   ├── train_on_startup.py          # Auto-train on boot
│   └── requirements.txt             # Python dependencies
│
├── 📂 models/                       # Trained model storage
├── docker-compose.yml               # Docker orchestration
└── package.json                     # Frontend dependencies
```

---

## 🔮 Fitur Model Prophet

### Optimisasi yang Diterapkan:

| Fitur | Deskripsi |
|-------|-----------|
| **Adaptive Parameters** | Parameter model menyesuaikan panjang data |
| **Lag Features** | Fitur lag 7 hari untuk pola jangka pendek |
| **Rolling Features** | Moving average & std untuk smoothing |
| **Outlier Handling** | Clip/remove data outlier |
| **Multiplicative Seasonality** | Seasonality berbasis persentase |
| **Calendar Features** | Integrasi hari libur nasional Indonesia |
| **Event Impact** | Faktor dampak event khusus (promo, dll) |

### Parameter Adaptif:
```
Data < 90 hari   → Conservative params (hindari overfitting)
Data 90-180 hari → Balanced params
Data > 180 hari  → Full model dengan yearly seasonality
```

### Endpoints ML Service:

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/ml/train` | POST | Melatih model Prophet |
| `/ml/predict` | POST | Generate forecast predictions |
| `/ml/model/{store_id}/status` | GET | Status & metadata model |
| `/health` | GET | Health check |

---

## 📊 Fitur Utama Aplikasi

### 1. **Dashboard Analytics**
- Ringkasan penjualan harian/mingguan/bulanan
- Grafik trend penjualan
- Produk terlaris
- Status stok rendah

### 2. **Manajemen Produk**
- CRUD produk lengkap
- Kategori produk
- Tracking stok real-time
- Search & filter produk

### 3. **Transaksi POS**
- Interface kasir modern
- Multi-item cart
- Riwayat transaksi
- Export laporan (PDF/Excel)

### 4. **Smart Prediction (AI)**
- Prediksi demand 30 hari ke depan
- Rekomendasi restock otomatis
- Visualisasi chart interaktif
- Confidence interval (upper/lower bound)
- Integrasi kalender event & libur

### 5. **Kalender Event**
- Manajemen event promosi
- Integrasi hari libur nasional Indonesia
- Impact factor untuk prediksi

### 6. **Manajemen User (RBAC)**
- 2-level role: Admin & Kasir
- Access control per fitur
- Firebase Authentication

### 7. **Pengaturan Toko**
- Profil toko (nama, logo, alamat)
- Pengaturan operasional
- Upload logo toko

### 8. **AI Chatbot**
- Asisten AI berbasis Gemini
- Bantuan penggunaan aplikasi
- Jawaban kontekstual

---

## 🔐 Sistem Autentikasi & Otorisasi

### Authentication: Firebase
- Email/Password login
- Session management
- Token validation

### Authorization: RBAC (Role-Based Access Control)

| Fitur | Admin | Kasir |
|-------|:-----:|:-----:|
| Dashboard (View) | ✅ | ✅ |
| Transaksi | ✅ | ✅ |
| Produk (View) | ✅ | ✅ |
| Produk (CRUD) | ✅ | ❌ |
| Smart Prediction | ✅ | ❌ |
| Kalender Event | ✅ | View Only |
| User Management | ✅ | ❌ |
| Settings | ✅ | ❌ |

---

## 🗃️ Skema Database (Supabase)

### Tabel Utama:

```sql
-- Products
products (id, name, category, stock, purchase_price, selling_price, ...)

-- Transactions
transactions (id, total, created_at, ...)
transaction_items (id, transaction_id, product_id, quantity, price)

-- Daily Sales Summary (untuk ML)
daily_sales_summary (ds, y)  -- ds: tanggal, y: total penjualan

-- Events
events (id, title, date, type, impact, ...)

-- Users
users (id, email, role, created_at, ...)

-- Store Settings
store_settings (id, store_name, logo_url, address, ...)
```

---

## 🐳 Docker Deployment

### Services:
```yaml
services:
  backend:      # Express.js API (Port 8000)
  ml-service:   # FastAPI + Prophet (Port 8001)
  frontend:     # React/Vite (Port 3000)
  retrain-scheduler:  # Optional - auto retrain
```

### Quick Start:
```bash
# Build dan jalankan semua services
docker-compose up --build

# Jalankan dengan scheduler (opsional)
docker-compose --profile scheduler up
```

### Environment Variables:
```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
GEMINI_API_KEY=AIza...
ML_SERVICE_URL=http://ml-service:8001
```

---

## 📈 Alur Kerja Prediksi

```
┌─────────────────────────────────────────────────────────────────┐
│                    Prediction Workflow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Data Collection                                              │
│     └─► Transaksi harian → daily_sales_summary                  │
│                                                                  │
│  2. Model Training                                               │
│     └─► Prophet learns patterns dari 180 hari data              │
│         • Trend                                                  │
│         • Weekly seasonality                                     │
│         • Holiday effects                                        │
│         • Event impacts                                          │
│                                                                  │
│  3. Prediction Generation                                        │
│     └─► Forecast 30 hari ke depan                               │
│         • yhat (predicted value)                                 │
│         • yhat_lower (lower bound)                               │
│         • yhat_upper (upper bound)                               │
│                                                                  │
│  4. Stock Recommendations                                        │
│     └─► Calculate restock needs per product                     │
│         • Current stock vs predicted demand                      │
│         • Urgency level (high/medium/low)                        │
│         • Suggested restock quantity                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Use Case Utama

### Skenario 1: Prediksi Menjelang Lebaran
1. Admin menambahkan event "Lebaran" dengan impact tinggi
2. Sistem memasukkan data libur nasional
3. Model Prophet memperhitungkan historical pattern Lebaran
4. Prediksi demand meningkat → Rekomendasi restock otomatis

### Skenario 2: Monitoring Stok Harian
1. Kasir melakukan transaksi via POS
2. Stok berkurang otomatis
3. Dashboard menampilkan produk stok rendah
4. Admin melihat rekomendasi restock

### Skenario 3: Analisis Trend Penjualan
1. Admin membuka halaman Smart Prediction
2. Melihat chart historis + prediksi
3. Menganalisis pola mingguan/musiman
4. Mengambil keputusan bisnis berdasarkan data

---

## 📝 API Endpoints Summary

### Backend (Express.js - Port 8000)

| Route | Deskripsi |
|-------|-----------|
| `GET /api/dashboard/*` | Statistik dashboard |
| `GET/POST /api/products/*` | CRUD produk |
| `GET/POST /api/transactions/*` | CRUD transaksi |
| `POST /api/forecast/train` | Train model |
| `POST /api/forecast/predict` | Get predictions |
| `GET/POST /api/events/*` | Kalender event |
| `GET /api/holidays/*` | Hari libur |
| `GET/POST /api/users/*` | Manajemen user |
| `GET/POST /api/settings/*` | Pengaturan toko |
| `POST /api/chat` | AI Chatbot |

---

## 🚀 Cara Menjalankan

### Development:
```bash
# Frontend
npm install
npm run dev

# Backend
cd backend-ts
npm install
npm run dev

# ML Service
cd ml-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Production (Docker):
```bash
docker-compose up --build -d
```

---

## 📊 Metrik Model

| Metrik | Deskripsi |
|--------|-----------|
| **Accuracy** | 100 - MAPE (Mean Absolute Percentage Error) |
| **Train MAPE** | Error pada data training |
| **Validation MAPE** | Error pada data validasi |
| **Model Age** | Umur model sejak training terakhir |

### Target Performance:
- Accuracy > 80% (MAPE < 20%)
- Model retrain jika umur > 7 hari

---

## 👥 Tim Pengembang

**Mata Kuliah:** Technopreneurship  
**Fokus:** Sistem Prediksi Stok Musiman dengan AI/ML

---

## 📄 Lisensi

Private Project - Tugas Kuliah Technopreneurship

---

*Dokumentasi ini dibuat pada: 21 Desember 2025*
