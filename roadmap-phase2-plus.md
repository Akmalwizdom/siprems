# Fase 2+ Implementation Plan — Upgrade Produksi `siprems-cd`

## Ringkasan
Dokumen ini melanjutkan Fase 1 ke eksekusi strategis detail (Fase 2 dan seterusnya) dengan urutan prioritas: **modernisasi frontend terlebih dahulu**, lalu **hardening API/security/data**, lalu **skalabilitas ML + DevOps + observability**.  
Target hasil: sistem siap produksi, aman, konsisten antar layanan, dan siap bertumbuh.

## 1. Visi Peningkatan Strategis
1. Frontend menjadi cepat, konsisten, dan maintainable dengan design system tunggal.
2. Kontrak FE/BE menjadi source of truth tunggal (contract-first) agar tidak ada endpoint drift.
3. Security dipindahkan dari "trust frontend" ke "server-verified + DB-enforced".
4. Operasi data dan transaksi bisnis dibuat atomic, observability-ready, dan scalable.
5. Pipeline ML dipisah dari request path kritis agar stabilitas aplikasi utama terjaga.
6. Delivery flow menjadi reproducible lewat CI/CD ber-gate, canary, rollback otomatis.

## 2. Roadmap Teknis Detail (Fase 2 dan seterusnya)

## Fase 2 (0-6 minggu) — Stabilize & Frontend Modernization First
### A. Frontend Architecture Reset (prioritas tertinggi)
1. Standarkan UI stack menjadi **Tailwind + shadcn primitives** sebagai base utama.
2. Kurangi inline style besar di layout ke layer CSS token/component utility.
3. Definisikan token global final: color, spacing, typography, radius, elevation, motion.
4. Audit responsif komponen kritis: sidebar, header, notifikasi, tabel produk/transaksi.
5. Optimasi bundle import (terutama icon/component import langsung per modul).
6. Harmonisasi page state: gunakan React Query untuk data server dan local state untuk UI transient.

Trade-off:
Kelebihan: UI konsisten, pengembangan fitur lebih cepat.  
Kekurangan: biaya refactor awal cukup besar.  
Alternatif: patch per halaman; cepat awal tapi technical debt bertambah.

### B. Contract Alignment FE/BE (wajib sebelum fitur baru)
1. Bentuk spesifikasi OpenAPI untuk endpoint aktif.
2. Samakan endpoint event/forecast yang saat ini drift.
3. Putuskan endpoint yang dihapus/deprecate dan sediakan compatibility adapter 1 rilis.
4. Generate typed client dari OpenAPI untuk frontend.
5. Tambahkan contract test agar mismatch gagal di CI.

Trade-off:
Kelebihan: menghilangkan regresi integrasi.  
Kekurangan: governance schema lebih ketat.  
Alternatif: fetch manual; fleksibel tapi rawan mismatch.

### C. Security Baseline Hardening
1. Verifikasi Firebase ID token di backend (Firebase Admin SDK).
2. Hapus auto-admin assignment untuk user baru; gunakan policy role provisioning eksplisit.
3. Kunci CORS by allowlist origin.
4. Tutup endpoint chat publik tanpa auth; minimal authenticate + rate limit.
5. Perketat kebijakan RLS dari `USING (true)` ke policy berbasis user/store context.

Trade-off:
Kelebihan: menutup privilege escalation/data leak.  
Kekurangan: setup secret/policy lebih kompleks.  
Alternatif: app-level check saja; sederhana tapi berisiko tinggi.

## Fase 3 (6-12 minggu) — Data/Backend Scalability
### A. Atomic Transaction & Data Integrity
1. Ganti alur create transaksi + item + update stok menjadi satu DB transaction (RPC/stored procedure).
2. Tambah guard untuk negative stock race condition.
3. Tambah idempotency key untuk create transaksi dari frontend.

Trade-off:
Kelebihan: konsistensi data kuat.  
Kekurangan: logika SQL lebih kompleks.  
Alternatif: update bertahap di app; mudah tapi rawan partial failure.

### B. Query & Storage Performance
1. Terapkan index strategy untuk filter/join berat (`transactions.date`, `transaction_items.transaction_id`, `products.category`, dll).
2. Ganti pagination offset deep-page jadi cursor untuk endpoint list besar.
3. Gunakan summary/materialized view untuk metrik dashboard berat.
4. Tambah cache layer (Redis/Upstash) untuk dashboard metrics, holiday data, model status.

Trade-off:
Kelebihan: latensi stabil saat data tumbuh.  
Kekurangan: tambahan invalidation logic.  
Alternatif: query langsung DB tiap request; mudah tapi mahal saat skala naik.

### C. API Governance & Versioning
1. Introduce `/api/v1` namespace.
2. Semua response pakai envelope seragam (`status`, `data`, `meta`, `error`).
3. Tambah schema validation request/response (Zod/Joi).
4. Terapkan rate limit + request size limit endpoint upload/chat.

Trade-off:
Kelebihan: API predictable, aman, mudah diaudit.  
Kekurangan: perlu migrasi client bertahap.  
Alternatif: format campuran; cepat tapi sulit dipelihara.

## Fase 4 (12-20 minggu) — MLOps, CI/CD, Observability, Business Growth
### A. ML Pipeline Workflow Productionization
1. Pisahkan train job ke worker asynchronous (queue/scheduler), bukan blocking startup.
2. Tambah model registry + metadata versioning.
3. Definisikan retrain trigger: age-based + data drift + quality threshold.
4. Tambah canary model rollout + automatic fallback model terakhir stabil.

Trade-off:
Kelebihan: stabilitas layanan prediksi naik.  
Kekurangan: komponen infra tambahan.  
Alternatif: training on startup; sederhana tapi risk availability.

### B. CI/CD Multi-Stage dengan Gate
1. Pipeline: lint/typecheck -> unit/integration -> security scan -> build image -> staging deploy -> smoke/e2e -> approval -> production canary -> verify -> rollback hook.
2. Tambah migration check stage sebelum deploy backend.
3. Tambah image signing + dependency vulnerability gate.

Trade-off:
Kelebihan: release lebih aman dan repeatable.  
Kekurangan: lead time rilis sedikit lebih lama di awal.  
Alternatif: deploy manual langsung; cepat sesaat tapi rawan human error.

### C. Observability & Ops
1. Structured logging (request id, user id, store id, latency, error class).
2. Metrics: p95 latency, error rate, cache hit, prediction success rate, queue lag.
3. Alerting: auth failure spike, DB timeout, ML unavailable, stock update failure.
4. Dashboard operasional untuk backend + ML + DB.

### D. Nilai Bisnis Lanjutan
1. Multi-store readiness: `store_id` jadi first-class di policy, query, cache key.
2. Approval workflow untuk restock high-cost.
3. Supplier lead-time & reorder policy terukur.
4. KPI adoption loop: recommendation acceptance rate, stockout reduction, overstock reduction.

## 3. Perubahan API/Interface/Type yang Harus Ditetapkan
1. Auth middleware wajib verified token server-side.
2. Event API diseragamkan:
   - `GET /api/v1/events`
   - `POST /api/v1/events`
   - `PUT /api/v1/events/:id`
   - `DELETE /api/v1/events/:id`
   - `POST /api/v1/events/:id/calibrate` (opsional, jika fitur dipertahankan)
3. Forecast API diseragamkan:
   - `POST /api/v1/forecast/train`
   - `POST /api/v1/forecast/predict/:storeId`
   - `GET /api/v1/forecast/model/:storeId/status`
   - `GET /api/v1/forecast/model/:storeId/accuracy`
4. Transaction API tambah idempotency header:
   - `Idempotency-Key`
5. Response envelope standar:
   - Success: `{ status: "success", data, meta? }`
   - Error: `{ status: "error", error: { code, message, details? } }`
6. Frontend typed client digenerate dari OpenAPI, menggantikan string-path manual.

## 4. Estimasi Kompleksitas per Area
1. Frontend modernisasi + design system: **Tinggi**
2. Contract-first API + typed client: **Sedang-Tinggi**
3. Security hardening auth + RLS: **Tinggi**
4. Atomic transaction + DB tuning: **Tinggi**
5. ML pipeline async + model registry: **Tinggi**
6. CI/CD + observability: **Sedang-Tinggi**
7. Business feature expansion (multi-store, supplier): **Sedang**

## 5. Strategi Mitigasi Risiko
1. Gunakan branch by abstraction untuk endpoint drift: adapter lama tetap hidup 1 rilis.
2. Jalankan migration dalam mode expand-then-contract agar backward compatible.
3. Canary release backend dan ML dengan rollback otomatis berbasis SLO.
4. Tambah contract test sebagai release gate wajib.
5. Terapkan feature flag untuk fitur frontend besar.
6. Gunakan shadow traffic untuk validasi model prediksi baru.
7. Definisikan SLO minimum:
   - API p95 < 500ms (endpoint non-ML)
   - error rate < 1%
   - prediction endpoint success > 99% (di luar data invalid)

## 6. Test Cases & Acceptance Scenarios
1. Auth & RBAC:
   - Token invalid ditolak 401.
   - User non-admin tidak bisa akses route admin.
   - User baru tidak otomatis admin.

2. Contract consistency:
   - Semua endpoint FE yang dipanggil ada di OpenAPI.
   - Contract test gagal jika shape response berubah tanpa versioning.

3. Transaction integrity:
   - Simulasi parallel checkout tidak menghasilkan stok negatif.
   - Kegagalan insert item membatalkan transaksi utama (rollback total).

4. Performance:
   - Dashboard metrics tidak full-scan raw transaction.
   - Cursor pagination stabil di halaman dalam.

5. ML availability:
   - Saat ML down, backend memberi graceful fallback message.
   - Retrain job tidak memblok startup service.

6. UI/UX:
   - Mobile layout tidak overflow horizontal.
   - Touch target minimum terpenuhi.
   - Contrast/focus state lulus audit aksesibilitas dasar.

7. CI/CD:
   - PR tanpa test/contract pass tidak bisa merge.
   - Deploy produksi tanpa approval gate ditolak.

## 7. Deliverables Fase 2+
1. `docs/architecture-target-v2.md`
2. `docs/api/openapi.yaml`
3. `docs/adr/` (keputusan arsitektur + trade-off)
4. `docs/runbooks/` (rollback, incident, model fallback)
5. `docs/roadmap-phase2-plus.md` (dokumen ini)

## 8. Asumsi & Default yang Dikunci
1. Timezone operasional default: **WIB (UTC+7)**.
2. Strategi deployment awal tetap Railway; optimasi dulu sebelum migrasi platform besar.
3. Scope awal tetap single-store secara operasional, tetapi schema/API disiapkan multi-store-ready.
4. Backward compatibility endpoint lama dipertahankan maksimal 1 siklus rilis.
5. Chat AI tetap dipertahankan, tetapi wajib authenticated + rate-limited.
