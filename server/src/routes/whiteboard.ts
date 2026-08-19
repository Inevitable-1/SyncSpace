import { Router } from 'express';
import { getWhiteboard, saveWhiteboard, uploadImage } from '../controllers/whiteboard.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/:roomId', asyncHandler(getWhiteboard));
router.put('/:roomId', asyncHandler(saveWhiteboard));
router.post('/:roomId/image', upload.single('file'), asyncHandler(uploadImage));

export default router;
