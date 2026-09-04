import { Role } from '@prisma/client';
import { Router } from 'express';

import { UserController } from '../../controllers/user.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { UserRepository } from '../../repositories/user.repository';
import { UserService } from '../../services/user.service';
import { createUserSchema, updateUserSchema } from '../../validators/user.validator';

const router: ReturnType<typeof Router> = Router();

// Initialize dependencies
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// Routes
router.get('/', authenticate, authorize(Role.ADMIN), userController.getAll);
router.get('/profile', authenticate, userController.getProfile);
router.get('/:id', authenticate, userController.getById);
router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  validate(createUserSchema),
  userController.create
);
router.put(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  validate(updateUserSchema),
  userController.update
);
router.delete('/:id', authenticate, authorize(Role.ADMIN), userController.delete);

export default router;
