import { Role } from '@prisma/client';
import { isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';
import { z } from 'zod';

const countryCodeSchema = z
  .string()
  .length(2, 'Country code must be 2 characters')
  .regex(/^[A-Za-z]{2}$/, 'Country code must be a valid ISO code');

export const createUserSchema = z
  .object({
    body: z.object({
      email: z.email('Invalid email format'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      phone: z.string().min(1, 'Phone is required'),
      countryCode: countryCodeSchema,
      role: z.nativeEnum(Role).default(Role.USER).optional(),
    }),
  })
  .refine(
    data => isValidPhoneNumber(data.body.phone, data.body.countryCode.toUpperCase() as CountryCode),
    {
      message: 'Invalid phone number for the provided country code',
      path: ['body', 'phone'],
    }
  );

export const updateUserSchema = z
  .object({
    body: z.object({
      email: z.email('Invalid email format').optional(),
      firstName: z.string().min(1, 'First name is required').optional(),
      lastName: z.string().min(1, 'Last name is required').optional(),
      phone: z.string().min(1, 'Phone is required').optional(),
      countryCode: countryCodeSchema.optional(),
      role: z.nativeEnum(Role).optional(),
    }),
    params: z.object({
      id: z.string().min(1, 'User ID is required'),
    }),
  })
  .refine(
    data => {
      if (!data.body.phone) return true;
      if (!data.body.countryCode) return false;
      return isValidPhoneNumber(
        data.body.phone,
        data.body.countryCode.toUpperCase() as CountryCode
      );
    },
    {
      message: 'Invalid phone number or missing country code',
      path: ['body', 'phone'],
    }
  );

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
