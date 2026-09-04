import { Router } from 'express';

// import { UserService } from '../../services/user.service.js';
import { UserRepository } from '../../repositories/user.repository.js';

const router: ReturnType<typeof Router> = Router();

// Initialize dependencies
const _userRepository = new UserRepository();
// const userService = new UserService(userRepository);
// const authController = new AuthController(userService);

// Routes
// router.post('/login', validate(loginSchema), authController.login);
// router.post('/register', validate(createUserSchema), authController.register);

export default router;
