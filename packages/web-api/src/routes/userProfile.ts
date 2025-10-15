/**
 * UserProfile Routes
 *
 * Defines routes for user profile endpoints
 *
 * @module routes/userProfile
 */

import { Router } from 'express';
import { UserProfileController } from '../controllers/UserProfileController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const userProfileController = new UserProfileController();

/**
 * GET /users/profile
 * Get current user's profile
 * Requires authentication
 */
router.get('/profile', authMiddleware, userProfileController.getProfile);

/**
 * PUT /users/profile
 * Update current user's profile
 * Requires authentication
 */
router.put('/profile', authMiddleware, userProfileController.updateProfile);

export { router as userProfileRouter };
