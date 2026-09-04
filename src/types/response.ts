export interface ResponseMeta {
  version: string;
  timestamp: string;
  requestId: string;
  correlationId?: string;
  responseTime: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ErrorPayload {
  message: string;
  details?: unknown;
  name?: string;
  stack?: string;
}

export interface StandardResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  error?: ErrorPayload;
  meta: ResponseMeta;
  pagination?: PaginationMeta;
}

export interface SuccessOptions {
  statusCode?: number;
  message?: string;
  pagination?: PaginationMeta;
}

export interface ErrorOptions {
  statusCode?: number;
  message?: string;
}
