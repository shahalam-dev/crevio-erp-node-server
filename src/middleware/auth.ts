import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { CustomError } from '../exceptions/CustomError';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new CustomError('No token provided', 401);
    }

    const decoded = jwt.verify(token, env.JWT_SECRET as string);

    if (typeof decoded === 'string') {
      throw new CustomError('Invalid token payload', 401);
    }

    req.user = decoded as { id: string; email: string; role?: string };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new CustomError('Invalid or expired token', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new CustomError('Unauthorized', 401);
    }

    if (!roles.includes(req.user.role || 'user')) {
      throw new CustomError('Insufficient permissions', 403);
    }

    next();
  };
};
