import crypto from 'crypto';

import type { Request, Response, NextFunction } from 'express';

const CORRELATION_ID_HEADER = 'x-correlation-id';

export const requestContext = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = crypto.randomUUID();
  const correlationId = req.get(CORRELATION_ID_HEADER) || undefined;
  const startTime = process.hrtime.bigint();

  res.locals.requestId = requestId;
  res.locals.correlationId = correlationId;
  res.locals.startTime = startTime;

  next();
};
