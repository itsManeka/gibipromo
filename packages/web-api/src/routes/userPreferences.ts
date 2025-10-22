/**
 * User Preferences Routes
 *
 * Defines routes for user preferences endpoints
 *
 * @module routes/userPreferences
 */

import { Router } from 'express';
import { UserPreferencesController } from '../controllers/UserPreferencesController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const userPreferencesController = new UserPreferencesController();

/**
 * GET /users/preferences
 * Get current user's preferences
 * Requires authentication
 */
router.get('/preferences', authMiddleware, userPreferencesController.getPreferences);

/**
 * PUT /users/preferences
 * Update current user's preferences
 * Requires authentication
 */
router.put('/preferences', authMiddleware, userPreferencesController.updatePreferences);

export default router;
