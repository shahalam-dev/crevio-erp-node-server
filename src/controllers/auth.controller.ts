import type { Request, Response, NextFunction } from 'express';

import { env } from '../config/env.js';
import { CustomError } from '../exceptions/CustomError.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { AuthService } from '../services/auth.service.js';

import { BaseController } from './base.controller.js';

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';

const parseDuration = (duration: string): number => {
  const match = duration.match(/^(\d+)([smhdw])$/);
  if (!match) return 0;

  const [, valueStr, unitStr] = match;
  if (!valueStr || !unitStr) return 0;

  const value = parseInt(valueStr, 10);
  const unit = unitStr as 's' | 'm' | 'h' | 'd' | 'w';

  const multipliers: Record<'s' | 'm' | 'h' | 'd' | 'w', number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] ?? 0);
};

const isProduction = env.NODE_ENV === 'production';

const accessCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  maxAge: parseDuration(env.JWT_ACCESS_EXPIRES_IN),
  path: '/',
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  maxAge: parseDuration(env.JWT_REFRESH_EXPIRES_IN),
  path: '/api/v1/auth/refresh',
};

const clearAccessCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

const clearRefreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/api/v1/auth/refresh',
};

export class AuthController extends BaseController {
  constructor(private authService: AuthService) {
    super();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);

      res.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, accessCookieOptions);
      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshCookieOptions);

      this.sendSuccess(
        req,
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        { statusCode: 201 }
      );
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body.email, req.body.password);

      res.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, accessCookieOptions);
      res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshCookieOptions);

      this.sendSuccess(req, res, {
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken as string | undefined;

      if (!refreshToken) {
        throw new CustomError('No refresh token provided', 401);
      }

      const tokens = await this.authService.refresh(refreshToken);

      res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, accessCookieOptions);
      res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshCookieOptions);

      this.sendSuccess(req, res, {
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken as string | undefined;

      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      res.clearCookie(ACCESS_TOKEN_COOKIE, clearAccessCookieOptions);
      res.clearCookie(REFRESH_TOKEN_COOKIE, clearRefreshCookieOptions);

      this.sendSuccess(req, res, undefined, {
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new CustomError('Unauthorized', 401);
      }

      const user = await this.authService.me(req.user.id);
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      this.sendSuccess(req, res, user);
    } catch (error) {
      next(error);
    }
  };
}
