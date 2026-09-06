# Crevio ERP Node Server

## 🚀 Features

- Express 5 with TypeScript 7
- Modular architecture (Controller → Service → Repository)
- Environment configuration with Zod validation
- JWT Authentication & Authorization
- Rate limiting & security middleware
- Validation with Zod
- ESLint + Prettier for code quality
- Git hooks with Husky + lint-staged
- Unit & integration testing with Vitest
- Docker & Docker Compose
- CI/CD pipeline with GitHub Actions
- Production-ready with PM2 & Nginx

## 📋 Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 16+
- Redis 7+ (or a Redis cloud instance)
- Docker (optional)

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/express-ts-app.git
cd express-ts-app

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Run migrations
npx prisma migrate dev

# Start development server
pnpm dev
```

## 📧 Email Service

Emails are sent asynchronously via **BullMQ** and **Redis** using a pluggable provider architecture. The default provider uses Gmail SMTP via Nodemailer.

### Running locally

Run the API server and the email worker in separate terminals:

```bash
# Terminal 1: API server
pnpm dev

# Terminal 2: email worker
pnpm worker
```

### Email verification flow

1. Register an account — a verification email is queued.
2. The email contains a link to `${FRONTEND_URL}/verify-email?token=<jwt>`.
3. Your frontend calls `POST /api/v1/auth/verify-email` with the token.
4. Once verified, the user can log in.

### Email environment variables

```env
REDIS_URL=redis://localhost:6379
EMAIL_FROM=noreply@example.com
FRONTEND_URL=https://app.example.com
EMAIL_VERIFICATION_SECRET=your-32-character-secret
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

> **Note:** Free tier Redis instances often use `volatile-lru` eviction policy, which triggers a BullMQ warning on startup. This is safe for development, but production Redis should use `noeviction`.

## 🗑️ Soft Delete Convention

Models that support soft delete must include a `deletedAt DateTime?` column in `prisma/schema.prisma` and extend `SoftDeleteRepository<T>` in their repository implementation.

- `findById` / `findAll` automatically exclude rows where `deletedAt` is set.
- `delete` performs a soft delete by setting `deletedAt` to the current timestamp.
- `update` is blocked for soft-deleted rows.
- Models without soft delete (e.g., one-time use tokens) should continue extending `BaseRepository<T>` directly.
