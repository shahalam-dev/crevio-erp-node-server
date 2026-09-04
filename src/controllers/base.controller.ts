import type { Request, Response } from 'express';

import type { CustomError } from '../exceptions/CustomError.js';
import type { SuccessOptions } from '../types/response.js';
import { sendError, sendSuccess } from '../utils/response.js';

export abstract class BaseController {
  protected sendSuccess<T>(
    req: Request,
    res: Response,
    data?: T,
    options: SuccessOptions = {}
  ): Response {
    return sendSuccess(req, res, data, options);
  }

  protected sendError(
    req: Request,
    res: Response,
    error: Error | CustomError,
    statusCode?: number
  ): Response {
    const options = statusCode !== undefined ? { statusCode } : {};
    return sendError(req, res, error, options);
  }
}
