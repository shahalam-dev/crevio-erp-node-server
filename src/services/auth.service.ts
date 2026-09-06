import crypto from 'crypto';

import type { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';

import { prisma } from '../config/database';
import { env } from '../config/env';
import { CustomError } from '../exceptions/CustomError';
import { EmailJob } from '../jobs/email.job';
import type { SafeUser } from '../repositories/user.repository';
import { UserRepository } from '../repositories/user.repository';
import type { JwtPayload } from '../types/index';

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: User['role'];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResult {
  user: SafeUser;
  message: string;
}

export interface VerifyEmailResult {
  user: SafeUser;
  message: string;
}

const SALT_ROUNDS = 12;

const toSafeUser = (user: User): SafeUser => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

interface EmailVerificationPayload {
  userId: string;
  email: string;
  type: 'email-verification';
}

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async register(input: RegisterInput): Promise<RegisterResult> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new CustomError('User already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await this.userRepository.create({
      ...input,
      password: hashedPassword,
    });

    const token = this.generateEmailVerificationToken(user);

    await EmailJob.sendVerificationEmail({
      to: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      token,
    });

    return {
      user: toSafeUser(user),
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new CustomError('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new CustomError('Invalid credentials', 401);
    }

    if (!user.emailVerifyAt) {
      throw new CustomError('Please verify your email before logging in', 403);
    }

    const tokens = await this.generateTokens(user);

    return {
      user: toSafeUser(user),
      ...tokens,
    };
  }

  async verifyEmail(token: string): Promise<VerifyEmailResult> {
    try {
      const payload = jwt.verify(token, env.EMAIL_VERIFICATION_SECRET) as EmailVerificationPayload;

      if (payload.type !== 'email-verification') {
        throw new CustomError('Invalid verification token', 400);
      }

      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      if (user.email !== payload.email) {
        throw new CustomError('Invalid verification token', 400);
      }

      if (user.emailVerifyAt) {
        return {
          user: toSafeUser(user),
          message: 'Email already verified',
        };
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifyAt: new Date() },
      });

      return {
        user: toSafeUser(updatedUser),
        message: 'Email verified successfully',
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        throw new CustomError('Invalid or expired verification token', 400);
      }
      throw error;
    }
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(email);

    if (!user || user.emailVerifyAt) {
      return {
        message:
          'If an account with this email exists and is unverified, a verification email has been sent.',
      };
    }

    const token = this.generateEmailVerificationToken(user);

    await EmailJob.sendVerificationEmail({
      to: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      token,
    });

    return {
      message:
        'If an account with this email exists and is unverified, a verification email has been sent.',
    };
  }

  async refresh(token: string): Promise<AuthTokens> {
    const payload = this.verifyRefreshToken(token);
    const jti = payload.jti;

    if (!jti) {
      throw new CustomError('Invalid refresh token', 401);
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { jti },
    });

    if (!storedToken) {
      throw new CustomError('Refresh token not found', 401);
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { jti } });
      throw new CustomError('Refresh token expired', 401);
    }

    const user = await this.userRepository.findById(storedToken.userId);
    if (!user) {
      await prisma.refreshToken.delete({ where: { jti } });
      throw new CustomError('User not found', 401);
    }

    await prisma.refreshToken.delete({ where: { jti } });

    return this.generateTokens(user);
  }

  async logout(token: string): Promise<void> {
    try {
      const payload = this.verifyRefreshToken(token);
      if (payload.jti) {
        await prisma.refreshToken.deleteMany({
          where: { jti: payload.jti },
        });
      }
    } catch {
      // Ignore invalid tokens during logout; still clear cookie on client
    }
  }

  async me(userId: string): Promise<SafeUser | null> {
    const user = await this.userRepository.findById(userId);
    return user ? toSafeUser(user) : null;
  }

  private generateEmailVerificationToken(user: User): string {
    const payload: EmailVerificationPayload = {
      userId: user.id,
      email: user.email,
      type: 'email-verification',
    };

    return jwt.sign(payload, env.EMAIL_VERIFICATION_SECRET, {
      expiresIn: env.EMAIL_VERIFICATION_EXPIRES_IN as NonNullable<SignOptions['expiresIn']>,
    });
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const accessPayload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };

    const jti = crypto.randomUUID();
    const refreshPayload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
      jti,
    };

    const accessToken = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as NonNullable<SignOptions['expiresIn']>,
    });

    const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as NonNullable<SignOptions['expiresIn']>,
    });

    const decoded = jwt.decode(refreshToken) as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000);

    await prisma.refreshToken.create({
      data: {
        jti,
        userId: user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;

      if (decoded.type !== 'refresh') {
        throw new CustomError('Invalid token type', 401);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new CustomError('Invalid or expired refresh token', 401);
      }
      throw error;
    }
  }
}
