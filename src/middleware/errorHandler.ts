import type { Request, Response, NextFunction } from 'express';

import { CustomError } from '../exceptions/CustomError.js';
import { sendError } from '../utils/response.js';

export const errorHandler = (
  error: Error | CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  // Log error
  console.error(`❌ Error: ${error.message}`);

  return sendError(req, res, error);
};
