import { Router } from 'express';
import { getWhiteboard, saveWhiteboard } from '../controllers/whiteboard.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/:roomId', asyncHandler(getWhiteboard));
router.put('/:roomId', asyncHandler(saveWhiteboard));

export default router;
