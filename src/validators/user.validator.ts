import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['user', 'admin']).default('user'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format').optional(),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    role: z.enum(['user', 'admin']).optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
