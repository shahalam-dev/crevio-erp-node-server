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
- Docker (optional)

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/express-ts-app.git
cd express-ts-app

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.development

# Run migrations
npx prisma migrate dev

# Start development server
pnpm dev
```

## 🗑️ Soft Delete Convention

Models that support soft delete must include a `deletedAt DateTime?` column in `prisma/schema.prisma` and extend `SoftDeleteRepository<T>` in their repository implementation.

- `findById` / `findAll` automatically exclude rows where `deletedAt` is set.
- `delete` performs a soft delete by setting `deletedAt` to the current timestamp.
- `update` is blocked for soft-deleted rows.
- Models without soft delete (e.g., one-time use tokens) should continue extending `BaseRepository<T>` directly.
