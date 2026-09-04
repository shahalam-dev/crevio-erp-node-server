import { DEFAULT_PAGINATION } from '../constants/index.js';

export function generateId(): string {
  return crypto.randomUUID();
}

// export function generateRandomString(length: number = 8): string {
//   return crypto.randomBytes(length).toString('hex');
// }

// export function formatDate(date: Date): string {
//   return date.toISOString().split('T')[0];
// }

export function formatDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

export function getPaginationOptions(query: {
  page?: string;
  limit?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}): {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  order: 'asc' | 'desc';
} {
  const page = Math.max(1, parseInt(query.page || String(DEFAULT_PAGINATION.PAGE)));
  const limit = Math.min(
    DEFAULT_PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit || String(DEFAULT_PAGINATION.LIMIT)))
  );
  const sortBy = query.sortBy || 'createdAt';
  const order = query.order || 'desc';

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sortBy,
    order,
  };
}

// export function maskEmail(email: string): string {
//   const [local, domain] = email.split('@');
//   const masked = local.charAt(0) + '*'.repeat(Math.min(3, local.length - 1));
//   return `${masked}@${domain}`;
// }

export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fieldsToRemove: string[]
): Partial<T> {
  const result = { ...obj };
  fieldsToRemove.forEach(field => {
    delete result[field];
  });
  return result;
}
