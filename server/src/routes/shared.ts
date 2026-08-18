import { Router } from 'express';
import { getSharedWorkspaces, getSharedRooms, getSharedFiles } from '../controllers/shared.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(authenticate);
router.get('/workspaces', asyncHandler(getSharedWorkspaces));
router.get('/rooms', asyncHandler(getSharedRooms));
router.get('/files', asyncHandler(getSharedFiles));

export default router;
