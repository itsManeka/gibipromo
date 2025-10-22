import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { LinkAccountsController } from '../controllers/LinkAccountsController';
import { LinkAccountsService } from '../services/LinkAccountsService';
import {
	DynamoDBLinkTokenRepository,
	DynamoDBUserRepository,
	DynamoDBActionRepository
} from '@gibipromo/shared';

const router = Router();

// Repositories
const linkTokenRepo = new DynamoDBLinkTokenRepository();
const userRepo = new DynamoDBUserRepository();
const actionRepo = new DynamoDBActionRepository();

// Service and Controller
const linkAccountsService = new LinkAccountsService(linkTokenRepo, userRepo, actionRepo);
const linkAccountsController = new LinkAccountsController(linkAccountsService);

// Protected routes
router.post('/link-telegram', authMiddleware, linkAccountsController.linkTelegram);
router.get('/link-telegram/status', authMiddleware, linkAccountsController.getLinkStatus);

export default router;

