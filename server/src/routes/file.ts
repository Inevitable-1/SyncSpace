import { Router } from 'express';
import { body } from 'express-validator';
import { getFiles, uploadFile, deleteFile, renameFile, getFolders } from '../controllers/file.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/folders', asyncHandler(getFolders));
router.get('/', asyncHandler(getFiles));
router.post(
  '/',
  [body('name').trim().notEmpty(), body('mimeType').notEmpty(), body('workspace').notEmpty()],
  asyncHandler(uploadFile),
);
router.delete('/:id', asyncHandler(deleteFile));
router.put('/:id/rename', [body('name').trim().notEmpty()], asyncHandler(renameFile));

export default router;
