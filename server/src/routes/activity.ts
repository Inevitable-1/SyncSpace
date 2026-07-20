import { Router } from 'express';
import { getActivities, deleteActivity, clearActivities } from '../controllers/activity.js';
import { authenticate } from '../middleware/auth.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(getActivities));
router.delete('/clear', asyncHandler(clearActivities));
router.delete('/:id', asyncHandler(deleteActivity));

router.use(errorHandler);

export default router;
