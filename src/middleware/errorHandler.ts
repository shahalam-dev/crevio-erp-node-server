import type { Request, Response, NextFunction } from 'express';

import { env } from '../config/env.js';
import { CustomError } from '../exceptions/CustomError.js';

export const errorHandler = (
  error: Error | CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;

  // Handle custom errors
  if (error instanceof CustomError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  }

  // Log error
  console.error(`❌ Error: ${error.message}`);
  if (env.NODE_ENV === 'development') {
    console.error(error.stack);
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
    ...(env.NODE_ENV === 'development' && { stack: error.stack }),
    ...(env.NODE_ENV === 'development' && { name: error.name }),
  });
};
