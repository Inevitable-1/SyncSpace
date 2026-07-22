import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import {
  addMember,
  removeMember,
  getMembers,
  updateMemberRole,
  suspendMember,
  reactivateMember,
  getMemberStats,
} from '../controllers/member.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sort').optional().isString(),
    query('order').optional().isIn(['asc', 'desc']),
    query('role').optional().isIn(['owner', 'admin', 'member']),
    query('status').optional().isIn(['active', 'invited', 'suspended']),
  ],
  getMembers,
);

router.get('/stats', getMemberStats);

router.post(
  '/',
  [
    body('userId').isMongoId().withMessage('Valid user ID is required'),
    body('role').optional().isIn(['admin', 'member']),
  ],
  addMember,
);

router.put(
  '/:memberId/role',
  [
    param('memberId').isMongoId(),
    body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member'),
  ],
  updateMemberRole,
);

router.put('/:memberId/suspend', [param('memberId').isMongoId()], suspendMember);

router.put('/:memberId/reactivate', [param('memberId').isMongoId()], reactivateMember);

router.delete('/:memberId', [param('memberId').isMongoId()], removeMember);

export default router;
