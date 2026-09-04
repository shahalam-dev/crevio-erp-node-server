import type { Role } from '@prisma/client';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { CustomError } from '../exceptions/CustomError';
import type { JwtPayload, RequestUser } from '../types/index';

export interface AuthRequest extends Request {
  user?: RequestUser;
}

const extractAccessToken = (req: AuthRequest): string | undefined => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  if (req.cookies && typeof req.cookies === 'object') {
    return req.cookies.accessToken as string | undefined;
  }

  return undefined;
};

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = extractAccessToken(req);

    if (!token) {
      throw new CustomError('No token provided', 401);
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    if (decoded.type !== 'access') {
      throw new CustomError('Invalid token type', 401);
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new CustomError('Invalid or expired token', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new CustomError('Unauthorized', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new CustomError('Insufficient permissions', 403);
    }

    next();
  };
};
