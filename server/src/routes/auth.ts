import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  verifyEmail,
  setPassword,
  resendVerification,
  login,
  demoLogin,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail({
    all_lowercase: true,
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
  }),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail({
    all_lowercase: true,
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
  }),
  body('password').notEmpty().withMessage('Password is required'),
];

const setPasswordValidation = [
  body('token').notEmpty().withMessage('Verification token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail({
    all_lowercase: true,
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
  }),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

router.post('/register', registerValidation, asyncHandler(register));
router.get('/verify-email/:token', asyncHandler(verifyEmail));
router.post('/set-password', setPasswordValidation, asyncHandler(setPassword));
router.post('/resend-verification', forgotPasswordValidation, asyncHandler(resendVerification));
router.post('/login', loginValidation, asyncHandler(login));
router.post('/demo', asyncHandler(demoLogin));
router.post('/refresh-token', asyncHandler(refreshToken));
router.post('/logout', asyncHandler(logout));
router.post('/forgot-password', forgotPasswordValidation, asyncHandler(forgotPassword));
router.post('/reset-password', resetPasswordValidation, asyncHandler(resetPassword));
router.get('/me', authenticate, asyncHandler(getMe));

export default router;
