import express from 'express';
import { authenticateApiKey } from '../middleware/apiKey';
import {
  mcpListTriggers,
  mcpCreateTrigger,
  mcpUpdateTrigger,
  mcpDeleteTrigger,
} from '../controllers/mcpController';

const router = express.Router();

// All MCP endpoints require API key authentication
router.use(authenticateApiKey);

router.get('/triggers/list', mcpListTriggers);
router.post('/triggers/create', mcpCreateTrigger);
router.put('/triggers/:id', mcpUpdateTrigger);
router.delete('/triggers/:id', mcpDeleteTrigger);

export default router;

