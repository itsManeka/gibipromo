import { Router } from 'express';
import { healthRouter } from './health';
import authRouter from './auth';

/**
 * Main router for the GibiPromo Web API
 * Aggregates all route modules following Clean Architecture
 */
const router = Router();

// Health check endpoints
router.use('/health', healthRouter);

// Authentication endpoints
router.use('/auth', authRouter);

// Future routes will be added here:
// router.use('/products', productRouter);
// router.use('/users', userRouter);
// router.use('/stats', statsRouter);

export { router };