import { Router } from 'express';
import { body } from 'express-validator';
import {
  getTasks,
  getTasksByWorkspace,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  getComments,
} from '../controllers/task.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/workspace/:workspaceId', asyncHandler(getTasksByWorkspace));
router.get('/', asyncHandler(getTasks));
router.post(
  '/',
  [body('title').trim().notEmpty(), body('workspace').notEmpty()],
  asyncHandler(createTask),
);
router.put('/:id', asyncHandler(updateTask));
router.delete('/:id', asyncHandler(deleteTask));
router.post('/:id/comments', [body('content').trim().notEmpty()], asyncHandler(addComment));
router.get('/:id/comments', asyncHandler(getComments));

export default router;
