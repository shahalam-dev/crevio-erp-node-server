import type { Request, Response, NextFunction } from 'express';

import { env } from '../config/env.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log request
  if (env.NODE_ENV !== 'test') {
    console.log(`📥 ${req.method} ${req.url}`);
  }

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - start;
    if (env.NODE_ENV !== 'test') {
      console.log(`📤 ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
    }
    return originalSend.call(this, data);
  };

  next();
};
