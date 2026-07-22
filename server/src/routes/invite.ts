import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import {
  createInvite,
  getInvites,
  acceptInvite,
  declineInvite,
  revokeInvite,
  getPendingInvites,
  getInviteStats,
} from '../controllers/invite.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sort').optional().isString(),
    query('order').optional().isIn(['asc', 'desc']),
    query('status').optional().isIn(['pending', 'accepted', 'declined', 'expired']),
    query('search').optional().isString(),
  ],
  getInvites,
);

router.get('/stats', getInviteStats);

router.get('/pending', getPendingInvites);

router.post(
  '/',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').optional().isIn(['admin', 'member']),
  ],
  createInvite,
);

router.post('/:token/accept', [param('token').isString()], acceptInvite);

router.post('/:token/decline', [param('token').isString()], declineInvite);

router.delete('/:inviteId', [param('inviteId').isMongoId()], revokeInvite);

export default router;
