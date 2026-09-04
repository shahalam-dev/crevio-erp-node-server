import type { Response } from 'express';

export abstract class BaseController {
  protected sendSuccess(res: Response, data: any, statusCode: number = 200) {
    res.status(statusCode).json({
      success: true,
      data,
    });
  }

  protected sendError(res: Response, error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
}
