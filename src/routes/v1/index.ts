import { Router } from 'express';

import authRoutes from './auth.routes';
import telegramRoutes from './telegram.routes';
import userRoutes from './user.routes';

const router: ReturnType<typeof Router> = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/telegram', telegramRoutes);

export default router;
