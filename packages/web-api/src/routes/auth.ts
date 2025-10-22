/**
 * Authentication Routes
 * 
 * Defines all authentication-related endpoints.
 * 
 * @module routes/auth
 */

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { email: string, password: string}
 */
router.post('/register', authController.register);

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 * @body    { email: string, password: string }
 */
router.post('/login', authController.login);

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 * @header  Authorization: Bearer <token>
 */
router.get('/me', authMiddleware, authController.me);

/**
 * @route   POST /auth/validate
 * @desc    Validate JWT token
 * @access  Public
 * @body    { token: string }
 */
router.post('/validate', authController.validateToken);

export default router;
