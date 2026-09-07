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

## 📱 Telegram Integration

Telegram is used as a communication channel for onboarding users and (future) bulk messaging.

### Features

- **User verification:** Users open a deep link from the app, share their phone number with the bot, and the system matches it with their registered phone.
- **Secure webhook:** Telegram updates are validated with a secret token.
- **Dev-friendly polling:** Local development uses polling instead of a webhook.
- **Rate-limit ready:** The provider/service layer is built so bulk messaging can be added later via BullMQ.

### Prerequisites

1. Create a Telegram bot via [@BotFather](https://t.me/BotFather).
2. Copy the bot token and username (e.g., `creviobd_bot`).
3. For production, you need a public HTTPS URL reachable by Telegram.

### Environment variables

Add these to your `.env` file:

```env
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_BOT_USERNAME=your_bot_username
PUBLIC_API_URL=https://api.creviobd.com
TELEGRAM_WEBHOOK_SECRET=your-32-character-secret
TELEGRAM_LINK_TOKEN_TTL_SECONDS=900
TELEGRAM_USE_POLLING=false
```

| Variable                          | Description                                                   |
| --------------------------------- | ------------------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN`              | Token from @BotFather. Keep secret.                           |
| `TELEGRAM_BOT_USERNAME`           | Bot username without `@`, e.g. `creviobd_bot`.                |
| `PUBLIC_API_URL`                  | Public HTTPS URL of this server. Used for webhooks.           |
| `TELEGRAM_WEBHOOK_SECRET`         | Random secret Telegram sends in the webhook header.           |
| `TELEGRAM_LINK_TOKEN_TTL_SECONDS` | Expiry of the deep-link verification token (default 900s).    |
| `TELEGRAM_USE_POLLING`            | `true` for local dev polling, `false` for production webhook. |

### User verification flow

1. The logged-in user clicks **"Verify Telegram"** in the app.
2. Frontend calls `GET /api/v1/telegram/link`.
3. Backend returns a deep link:
   ```text
   https://t.me/{TELEGRAM_BOT_USERNAME}?start={token}
   ```
4. User opens the link; Telegram launches the bot.
5. Bot asks the user to share their phone number.
6. User shares the contact.
7. Backend verifies:
   - the contact belongs to the sender
   - the phone number matches the registered user
   - stores `telegramChatId` and sets `telegramVerifyAt`
8. Frontend polls `/api/v1/users/profile` and checks `telegramVerifyAt`.

### API endpoints

| Method | Path                    | Auth                | Description                              |
| ------ | ----------------------- | ------------------- | ---------------------------------------- |
| `GET`  | `/api/v1/telegram/link` | JWT / cookie        | Generate Telegram verification deep link |
| `POST` | `/webhooks/telegram`    | Secret token header | Receive Telegram bot updates             |

### Development vs production

#### Development

Use polling so you don’t need a public HTTPS URL:

```env
TELEGRAM_USE_POLLING=true
```

The server will call Telegram’s `getUpdates` every second.

#### Production

Set a real public API URL and use webhook mode:

```env
TELEGRAM_USE_POLLING=false
PUBLIC_API_URL=https://api.creviobd.com
```

The server automatically calls `setWebhook` on startup, pointing Telegram to:

```text
https://api.creviobd.com/webhooks/telegram
```

### Phone number handling

- Phone numbers are stored in **E.164** format (e.g., `+8801303818165`).
- Registration and profile updates require a `countryCode` field from the frontend.
- `libphonenumber-js` normalizes the input using the provided country code.
- Telegram may send contacts with spaces/dashes; the bot sanitizes them before matching.

### Security

- The bot token must never be committed or logged.
- Webhook requests are rejected unless the `X-Telegram-Bot-Api-Secret-Token` header matches `TELEGRAM_WEBHOOK_SECRET`.
- The deep-link token is a short-lived opaque Redis token.
- The bot verifies that a shared contact belongs to the sender (`contact.user_id === message.from.id`).

### Troubleshooting

| Error                                               | Cause                                            | Fix                                                                   |
| --------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| `Failed to resolve host: Name or service not known` | `PUBLIC_API_URL` is not a real reachable domain. | Use polling locally or set the correct production domain.             |
| `The shared phone number is invalid`                | Telegram sent the number with formatting/spaces. | Already handled by sanitization; check server logs for the raw value. |
| `This verification link has expired`                | The deep-link token expired or was already used. | Request a new link from the app.                                      |

### Future: bulk messaging

Bulk Telegram messaging is not implemented yet, but the provider/service layer is ready. When needed, add a `telegramQueue` in BullMQ with a rate limiter (e.g., 20 messages/second) and a worker that calls `telegramService.sendMessage()`.

## 🗑️ Soft Delete Convention

Models that support soft delete must include a `deletedAt DateTime?` column in `prisma/schema.prisma` and extend `SoftDeleteRepository<T>` in their repository implementation.

- `findById` / `findAll` automatically exclude rows where `deletedAt` is set.
- `delete` performs a soft delete by setting `deletedAt` to the current timestamp.
- `update` is blocked for soft-deleted rows.
- Models without soft delete (e.g., one-time use tokens) should continue extending `BaseRepository<T>` directly.
