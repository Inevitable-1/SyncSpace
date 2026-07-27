import { Router } from 'express';
import { body } from 'express-validator';
import {
  createRoom,
  getRooms,
  getRoom,
  updateRoom,
  deleteRoom,
  restoreRoom,
  joinRoom,
  getStats,
  getInviteLink,
} from '../controllers/room.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const createValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('type').optional().isIn(['whiteboard', 'code', 'document']),
  body('description').optional().trim().isLength({ max: 500 }),
  body('workspaceId').notEmpty().withMessage('Workspace ID is required'),
];

const updateValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('type').optional().isIn(['whiteboard', 'code', 'document']),
  body('description').optional().trim().isLength({ max: 500 }),
];

router.use(authenticate);

router.get('/stats', asyncHandler(getStats));
router.post('/', createValidation, asyncHandler(createRoom));
router.get('/', asyncHandler(getRooms));
router.get('/:id', asyncHandler(getRoom));
router.get('/:id/invite-link', asyncHandler(getInviteLink));
router.put('/:id', updateValidation, asyncHandler(updateRoom));
router.delete('/:id', asyncHandler(deleteRoom));
router.post('/:id/restore', asyncHandler(restoreRoom));
router.post('/join', asyncHandler(joinRoom));

export default router;
