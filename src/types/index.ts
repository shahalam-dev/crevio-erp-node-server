import type { Role } from '@prisma/client';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
  type: 'access' | 'refresh';
  jti?: string;
  iat?: number;
  exp?: number;
}

export type RequestUser = {
  id: string;
  email: string;
  role: Role;
};

export * from './response.js';
