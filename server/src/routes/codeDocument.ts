import { Router } from 'express';
import { body } from 'express-validator';
import {
  getDocumentsByRoom,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  renameDocument,
} from '../controllers/codeDocument.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const createValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }),
  body('content').optional().isString(),
  body('language').optional().isString(),
  body('roomId').notEmpty().withMessage('Room ID is required').isMongoId(),
  body('workspaceId').notEmpty().withMessage('Workspace ID is required').isMongoId(),
  body('parentPath').optional().isString(),
  body('isFolder').optional().isBoolean(),
];

const updateValidation = [
  body('content').optional().isString(),
  body('name').optional().trim().isLength({ max: 255 }),
  body('language').optional().isString(),
];

const renameValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 255 }),
];

router.use(authenticate);

router.get('/room/:roomId', asyncHandler(getDocumentsByRoom));
router.get('/:id', asyncHandler(getDocumentById));
router.post('/', createValidation, asyncHandler(createDocument));
router.put('/:id', updateValidation, asyncHandler(updateDocument));
router.put('/:id/rename', renameValidation, asyncHandler(renameDocument));
router.delete('/:id', asyncHandler(deleteDocument));

export default router;
