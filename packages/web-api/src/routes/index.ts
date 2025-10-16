import { Router } from 'express';
import { healthRouter } from './health';
import authRouter from './auth';
import productsRouter from './products';
import { userProfileRouter } from './userProfile';
import userPreferencesRouter from './userPreferences';

/**
 * Main router for the GibiPromo Web API
 * Aggregates all route modules following Clean Architecture
 */
const router = Router();

// Health check endpoints
router.use('/health', healthRouter);

// Authentication endpoints
router.use('/auth', authRouter);

// Products endpoints
router.use('/products', productsRouter);

// User profile endpoints
router.use('/users/', userProfileRouter);

// User preferences endpoints
router.use('/users/', userPreferencesRouter);

// Future routes will be added here:
// router.use('/stats', statsRouter);

export { router };