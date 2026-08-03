import { Router } from 'express';
import {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  startMeeting,
  endMeeting,
  joinMeeting,
  getMeetingStats,
} from '../controllers/meeting.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(getMeetings));
router.get('/stats', asyncHandler(getMeetingStats));
router.get('/:id', asyncHandler(getMeeting));
router.post('/', asyncHandler(createMeeting));
router.put('/:id', asyncHandler(updateMeeting));
router.delete('/:id', asyncHandler(deleteMeeting));
router.post('/:id/start', asyncHandler(startMeeting));
router.post('/:id/end', asyncHandler(endMeeting));
router.post('/:id/join', asyncHandler(joinMeeting));

export default router;
