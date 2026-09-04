import { Router } from 'express';

// import { UserService } from '../../services/user.service.js';
import { UserRepository } from '../../repositories/user.repository.js';

const router: ReturnType<typeof Router> = Router();

// Initialize dependencies
const _userRepository = new UserRepository();
// const userService = new UserService(userRepository);
// const userController = new UserController(userService);

// Routes
// router.get('/', authenticate, authorize('admin'), userController.getAll);
// router.get('/profile', authenticate, userController.getProfile);
// router.get('/:id', authenticate, userController.getById);
// router.post('/', authenticate, authorize('admin'), validate(createUserSchema), userController.create);
// router.put('/:id', authenticate, authorize('admin'), validate(updateUserSchema), userController.update);
// router.delete('/:id', authenticate, authorize('admin'), userController.delete);

export default router;
