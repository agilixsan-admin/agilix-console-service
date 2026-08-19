# Agilix Console Service

Backend service untuk platform SaaS Monitoring Tenant POS — mengelola autentikasi, tenant, invoice, perangkat POS, notifikasi, dan analitik dashboard.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | NestJS + TypeScript |
| Database | PostgreSQL 16 + TypeORM |
| Cache / Queue | Redis 7 + BullMQ |
| Auth | JWT (Access + Refresh Token) |
| Authorization | RBAC (Role-Based Access Control) |
| Realtime | Server-Sent Events (SSE) |
| Container | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| CI/CD | GitHub Actions |

---

## Fitur Utama

- **Authentication** — Login, logout, refresh token, token blacklist via Redis
- **Authorization (RBAC)** — Role: `SUPER_ADMIN`, `FINANCE`, `SUPPORT`, `VIEWER`
- **Tenant Management** — CRUD tenant, lock/unlock, integrasi ERP webhook
- **Invoice Management** — Pembuatan, pembayaran, pembatalan invoice + PDF generation
- **POS Device Monitoring** — Registrasi dan monitoring perangkat POS per tenant
- **Audit Logging** — Immutable log untuk semua aksi kritis
- **Notification System** — Notifikasi in-app + email via SMTP
- **Server-Sent Events (SSE)** — Realtime event stream ke client
- **Dashboard Analytics** — Statistik tenant, invoice, dan perangkat
- **Background Jobs** — Invoice reminder & overdue check via BullMQ cron

---

## Struktur Proyek

```
src/
├── configs/          # Konfigurasi app, database, validasi env
├── controllers/      # HTTP request handler
│   └── modules/
├── service/          # Business logic
│   └── modules/
├── repositories/     # Database access layer (TypeORM)
│   └── modules/
├── routes/           # Route registration
│   └── modules/
├── models/           # TypeORM entity
├── dto/              # Data Transfer Object + validasi
├── guards/           # JWT Auth Guard, Roles Guard
├── decorators/       # Custom decorator (CurrentUser, Roles)
├── middlewares/      # HTTP logger, request context
├── events/           # SSE / Realtime service
├── queues/           # BullMQ job & processor
├── migrations/       # TypeORM migration
├── seeds/            # Database seeder
├── types/            # Enum & shared types
├── app.module.ts
└── main.ts

test/
├── config/           # constants.ts, functionUnitTest.ts
├── modules/          # Unit test per service
└── integration/      # E2E integration test
```

---

## Prasyarat

- Node.js >= 20
- PostgreSQL 16
- Redis 7
- Docker & Docker Compose (opsional)

---

## Setup Lokal

### 1. Install dependencies

```bash
npm install
```

### 2. Konfigurasi environment

```bash
cp .env.example .env
```

Isi nilai berikut yang wajib diisi:

```env
DB_PASSWORD=
JWT_SECRET=                  # min 32 karakter, gunakan: openssl rand -hex 32
JWT_REFRESH_SECRET=          # harus berbeda dari JWT_SECRET
SEED_SUPER_ADMIN_PASSWORD=
```

### 3. Jalankan database & Redis via Docker

```bash
docker compose up postgres redis -d
```

### 4. Jalankan migration

```bash
npm run migration:run
```

### 5. Seed data awal (Super Admin)

```bash
npm run seed
```

### 6. Jalankan aplikasi

```bash
# Development (watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

Aplikasi berjalan di: `http://localhost:3000`

---

## Docker (Full Stack)

Menjalankan seluruh stack (app + PostgreSQL + Redis) dalam satu perintah:

```bash
docker compose up -d
```

---

## Database Migration

```bash
# Generate migration dari perubahan entity
npm run migration:generate -- src/migrations/NamaMigration

# Jalankan migration
npm run migration:run

# Revert migration terakhir
npm run migration:revert

# Lihat status migration
npm run migration:show
```

---

## Testing

### Unit Test

```bash
# Jalankan semua unit test
npm test

# Jalankan satu file
npx jest test/modules/user.service.spec.ts --no-coverage

# Dengan coverage (target >= 80%)
npm run test:cov
```

### Integration Test (membutuhkan Docker)

```bash
npm run test:integration
```

Script ini otomatis menjalankan Docker container test, menjalankan integration test, lalu mematikan container.

---

## API Documentation

Swagger UI tersedia saat aplikasi berjalan:

```
http://localhost:3000/api/docs
```



---

## RBAC

| Role | Deskripsi |
|---|---|
| `SUPER_ADMIN` | Akses penuh ke semua fitur |
| `FINANCE` | Mengelola invoice dan pembayaran |
| `SUPPORT` | Mengelola tenant dan perangkat POS |
| `VIEWER` | Read-only |



---

## CI/CD

Pipeline GitHub Actions (`.github/workflows/github-action.yml`) berjalan otomatis:

| Trigger | Job |
|---|---|
| Push / PR ke `main` | Lint + Unit Test + Build |
| Push ke `main` | Integration Test (PostgreSQL + Redis nyata) |
| Push ke `main` (setelah test pass) | Deploy ke VPS via SCP |

---

## Environment Variables

Lihat [`env.example`](.env.example) untuk daftar lengkap dengan penjelasan.

Variabel kritis:

| Variable | Keterangan |
|---|---|
| `JWT_SECRET` | Secret access token (min 32 char) |
| `JWT_REFRESH_SECRET` | Secret refresh token (harus berbeda) |
| `DB_*` | Konfigurasi PostgreSQL |
| `REDIS_HOST / REDIS_PORT` | Konfigurasi Redis |
| `SMTP_*` | Konfigurasi email |
| `ERP_WEBHOOK_URL` | Endpoint ERP untuk event push |

---


## License

This project is licensed under the [BSD 2-Clause License](LICENSE).
