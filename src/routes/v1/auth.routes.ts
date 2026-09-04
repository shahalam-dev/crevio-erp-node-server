import { Router } from 'express';

import { AuthController } from '../../controllers/auth.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { UserRepository } from '../../repositories/user.repository';
import { AuthService } from '../../services/auth.service';
import { loginSchema, registerSchema } from '../../validators/auth.validator';

const router: ReturnType<typeof Router> = Router();

// Initialize dependencies
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

// Routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
