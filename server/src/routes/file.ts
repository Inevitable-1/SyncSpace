import { Router } from 'express';
import { body } from 'express-validator';
import {
  getFiles,
  uploadFile,
  downloadFile,
  deleteFile,
  renameFile,
  getFolders,
  uploadAvatar,
  uploadCover,
} from '../controllers/file.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/folders', asyncHandler(getFolders));
router.get('/', asyncHandler(getFiles));
router.post('/', upload.single('file'), asyncHandler(uploadFile));
router.post('/avatar', upload.single('file'), asyncHandler(uploadAvatar));
router.post('/cover', upload.single('file'), asyncHandler(uploadCover));
router.get('/:id/download', asyncHandler(downloadFile));
router.delete('/:id', asyncHandler(deleteFile));
router.put('/:id/rename', [body('name').trim().notEmpty()], asyncHandler(renameFile));

export default router;
