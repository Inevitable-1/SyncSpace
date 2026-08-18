import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteProfile,
  getContributionScore,
  getHeatmapData,
  getMonthlyCalendar,
} from '../controllers/profile.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(getProfile));

router.put(
  '/',
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
    body('avatar').optional().isString(),
    body('coverImage').optional().isString(),
    body('bio').optional().isLength({ max: 300 }),
  ],
  asyncHandler(updateProfile),
);

router.put(
  '/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/)
      .withMessage('Password must contain an uppercase letter')
      .matches(/[a-z]/)
      .withMessage('Password must contain a lowercase letter')
      .matches(/\d/)
      .withMessage('Password must contain a number'),
  ],
  asyncHandler(changePassword),
);

router.delete('/', asyncHandler(deleteProfile));

router.get('/contributions', asyncHandler(getContributionScore));

router.get('/heatmap', asyncHandler(getHeatmapData));

router.get('/calendar', asyncHandler(getMonthlyCalendar));

export default router;
