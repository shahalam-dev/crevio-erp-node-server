import crypto from 'crypto';

import type { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';

import { prisma } from '../config/database';
import { env } from '../config/env';
import { CustomError } from '../exceptions/CustomError';
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

const SALT_ROUNDS = 12;

const toSafeUser = (user: User): SafeUser => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new CustomError('User already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await this.userRepository.create({
      ...input,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user);

    return {
      user: toSafeUser(user),
      ...tokens,
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

    const tokens = await this.generateTokens(user);

    return {
      user: toSafeUser(user),
      ...tokens,
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

    // Rotate refresh token: delete old, create new
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
