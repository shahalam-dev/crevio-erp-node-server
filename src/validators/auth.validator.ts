import { Role } from '@prisma/client';
import { isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';
import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const countryCodeSchema = z
  .string()
  .length(2, 'Country code must be 2 characters')
  .regex(/^[A-Za-z]{2}$/, 'Country code must be a valid ISO code');

export const registerSchema = z
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

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.email('Invalid email format'),
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>['body'];
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>['body'];
