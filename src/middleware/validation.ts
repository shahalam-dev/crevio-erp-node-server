import type { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

import { CustomError } from '../exceptions/CustomError';

export const validate = (schema: ZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        next(new CustomError('Validation failed', 400, errors));
      } else {
        next(error);
      }
    }
  };
};
