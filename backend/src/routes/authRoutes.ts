import express from 'express';
import { register, login, me } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, me);

export default router;

