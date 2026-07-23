import { Router } from 'express';
import { body } from 'express-validator';
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markSeen,
} from '../controllers/chat.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const sendMessageValidation = [
  body('content').trim().notEmpty().withMessage('Content is required').isLength({ max: 5000 }),
  body('type').optional().isIn(['text', 'emoji', 'system']),
  body('replyTo').optional().isMongoId(),
];

const editMessageValidation = [
  body('content').trim().notEmpty().withMessage('Content is required').isLength({ max: 5000 }),
];

router.use(authenticate);

router.get('/:roomId', asyncHandler(getMessages));
router.post('/:roomId', sendMessageValidation, asyncHandler(sendMessage));
router.put('/:messageId', editMessageValidation, asyncHandler(editMessage));
router.delete('/:messageId', asyncHandler(deleteMessage));
router.post('/:roomId/seen', asyncHandler(markSeen));

export default router;
