import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(getDashboard));

export default router;
