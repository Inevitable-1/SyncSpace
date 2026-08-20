import { Router } from 'express';
import { body } from 'express-validator';
import { runCode } from '../controllers/codeRun.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const runCodeValidation = [
  body('language').isIn(['java', 'python', 'c', 'cpp']).withMessage('Unsupported language'),
  body('code').trim().notEmpty().withMessage('Code is required').isLength({ max: 50000 }),
];

router.use(authenticate);

router.post('/', runCodeValidation, asyncHandler(runCode));

export default router;
