import type { Request, Response, NextFunction } from 'express';

import { env } from '../config/env.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Log request
  if (env.NODE_ENV !== 'test') {
    console.log(`📥 ${req.method} ${req.url}`);
  }

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const startTime = res.locals.startTime as bigint | undefined;
    let duration = 0;

    if (startTime !== undefined) {
      duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    }

    res.locals.responseTime = `${Math.round(duration)}ms`;

    if (env.NODE_ENV !== 'test') {
      console.log(`📤 ${req.method} ${req.url} ${res.statusCode} ${res.locals.responseTime}`);
    }
    return originalSend.call(this, data);
  };

  next();
};
