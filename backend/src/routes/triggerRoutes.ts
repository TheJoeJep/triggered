import express from 'express';
import {
  listTriggers,
  getTrigger,
  createTrigger,
  updateTrigger,
  deleteTrigger,
  pauseTrigger,
  resumeTrigger,
  getTriggerExecutions,
} from '../controllers/triggerController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, listTriggers);
router.get('/:id', authenticateToken, getTrigger);
router.post('/', authenticateToken, createTrigger);
router.put('/:id', authenticateToken, updateTrigger);
router.delete('/:id', authenticateToken, deleteTrigger);
router.post('/:id/pause', authenticateToken, pauseTrigger);
router.post('/:id/resume', authenticateToken, resumeTrigger);
router.get('/:id/executions', authenticateToken, getTriggerExecutions);

export default router;

