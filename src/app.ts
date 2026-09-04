import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import type { Express, Request, Response } from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { CustomError } from './exceptions/CustomError.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { requestContext } from './middleware/requestContext.js';
import v1Routes from './routes/v1/index.js';
import { sendSuccess, sendError } from './utils/response.js';

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.NODE_ENV === 'production' ? ['https://creviobd.com'] : '*',
    credentials: true,
  })
);
app.use(compression());

// Cookie parsing
app.use(cookieParser());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request context (must be before requestLogger so timing works)
app.use(requestContext);

// Logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  sendSuccess(req, res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API Routes
app.use('/api/v1', v1Routes);

// 404 handler
app.use((req: Request, res: Response) => {
  sendError(req, res, new CustomError('Route not found', 404));
});

// Error handler
app.use(errorHandler);

export default app;
