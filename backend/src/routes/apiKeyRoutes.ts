import express from 'express';
import { listApiKeys, createApiKey, deleteApiKey } from '../controllers/apiKeyController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, listApiKeys);
router.post('/', authenticateToken, createApiKey);
router.delete('/:id', authenticateToken, deleteApiKey);

export default router;

