import type { Request, Response, NextFunction } from 'express';

import { CustomError } from '../exceptions/CustomError.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { UserService } from '../services/user.service.js';

import { BaseController } from './base.controller.js';

export class UserController extends BaseController {
  constructor(private userService: UserService) {
    super();
  }

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.userService.findAll();
      this.sendSuccess(req, res, users);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new CustomError('User ID is required', 400);
      }

      const user = await this.userService.findById(id);
      this.sendSuccess(req, res, user);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.create(req.body);
      this.sendSuccess(req, res, user, { statusCode: 201 });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const user = await this.userService.update(id, req.body);
      this.sendSuccess(req, res, user);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      await this.userService.delete(id);
      this.sendSuccess(req, res, undefined, {
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new CustomError('Unauthorized', 401);
      }

      const user = await this.userService.findById(req.user.id);
      this.sendSuccess(req, res, user);
    } catch (error) {
      next(error);
    }
  };
}
