import { Router } from 'express';
import { body } from 'express-validator';
import { getProfile, updateProfile } from '../controllers/profile.js';
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
    body('bio').optional().isLength({ max: 300 }),
  ],
  asyncHandler(updateProfile),
);

export default router;
