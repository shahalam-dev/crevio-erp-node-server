import type { Request, Response } from 'express';

import { env } from '../config/env.js';
import { CustomError } from '../exceptions/CustomError.js';
import type {
  ErrorOptions,
  ErrorPayload,
  PaginationMeta,
  ResponseMeta,
  StandardResponse,
  SuccessOptions,
} from '../types/response.js';

const API_VERSION = 'v1';

export const buildMeta = (req: Request, res: Response): ResponseMeta => {
  const requestId = (res.locals.requestId as string | undefined) ?? 'unknown';
  const correlationId = res.locals.correlationId as string | undefined;

  let responseTime = res.locals.responseTime as string | undefined;
  if (responseTime === undefined) {
    const startTime = res.locals.startTime as bigint | undefined;
    if (startTime !== undefined) {
      const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;
      responseTime = `${Math.round(duration)}ms`;
    } else {
      responseTime = '0ms';
    }
  }

  const meta: ResponseMeta = {
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    requestId,
    responseTime,
  };

  if (correlationId !== undefined) {
    meta.correlationId = correlationId;
  }

  return meta;
};

export const buildPagination = (page: number, limit: number, total: number): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

export const sendSuccess = <T>(
  req: Request,
  res: Response,
  data?: T,
  options: SuccessOptions = {}
): Response<StandardResponse<T>> => {
  const { statusCode = 200, message, pagination } = options;

  const response: StandardResponse<T> = {
    success: true,
    statusCode,
    meta: buildMeta(req, res),
  };

  if (message !== undefined) {
    response.message = message;
  }

  if (data !== undefined) {
    response.data = data;
  }

  if (pagination !== undefined) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (
  req: Request,
  res: Response,
  error: Error | CustomError,
  options: ErrorOptions = {}
): Response<StandardResponse<never>> => {
  const statusCode = options.statusCode ?? (error instanceof CustomError ? error.statusCode : 500);
  const message = options.message ?? error.message ?? 'Internal Server Error';

  const errorPayload: ErrorPayload = {
    message,
  };

  if (error instanceof CustomError && error.details !== undefined) {
    errorPayload.details = error.details;
  }

  if (env.NODE_ENV === 'development') {
    errorPayload.name = error.name;
    if (error.stack !== undefined) {
      errorPayload.stack = error.stack;
    }
  }

  const response: StandardResponse<never> = {
    success: false,
    statusCode,
    error: errorPayload,
    meta: buildMeta(req, res),
  };

  return res.status(statusCode).json(response);
};
