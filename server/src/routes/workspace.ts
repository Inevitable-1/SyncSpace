import { Router } from 'express';
import { body } from 'express-validator';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  restoreWorkspace,
  getTrash,
  searchWorkspaces,
  regenerateInviteCode,
  joinByInviteCode,
  toggleFavorite,
  archiveWorkspace,
  unarchiveWorkspace,
} from '../controllers/workspace.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const createValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('color').optional().isString(),
  body('icon').optional().isString(),
  body('isPublic').optional().isBoolean(),
];

const updateValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('color').optional().isString(),
  body('icon').optional().isString(),
  body('isPublic').optional().isBoolean(),
];

router.use(authenticate);

router.post('/', createValidation, asyncHandler(createWorkspace));
router.get('/', asyncHandler(getWorkspaces));
router.get('/search', asyncHandler(searchWorkspaces));
router.get('/trash', asyncHandler(getTrash));
router.get('/:id', asyncHandler(getWorkspace));
router.put('/:id', updateValidation, asyncHandler(updateWorkspace));
router.delete('/:id', asyncHandler(deleteWorkspace));
router.post('/:id/restore', asyncHandler(restoreWorkspace));
router.post('/:id/invite-code', asyncHandler(regenerateInviteCode));
router.post('/join', asyncHandler(joinByInviteCode));
router.post('/:id/favorite', asyncHandler(toggleFavorite));
router.post('/:id/archive', asyncHandler(archiveWorkspace));
router.post('/:id/unarchive', asyncHandler(unarchiveWorkspace));

export default router;
