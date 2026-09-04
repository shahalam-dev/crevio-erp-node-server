import { Role } from '@prisma/client';
import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().min(1, 'Phone is required'),
    role: z.nativeEnum(Role).default(Role.USER).optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format').optional(),
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    phone: z.string().min(1, 'Phone is required').optional(),
    role: z.nativeEnum(Role).optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
