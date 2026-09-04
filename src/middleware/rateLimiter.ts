import type { Request, Response, NextFunction } from 'express';

import { env } from '../config/env.js';
import { CustomError } from '../exceptions/CustomError.js';
import { sendError } from '../utils/response.js';

// Simple in-memory rate limiter (use Redis for production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  if (env.NODE_ENV === 'test') return next();

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  if (now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    sendError(req, res, new CustomError('Too many requests, please try again later.', 429));
    return;
  }

  record.count++;
  next();
};
