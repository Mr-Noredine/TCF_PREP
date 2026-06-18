import express from 'express';
import { register, login, getCurrentUser, googleAuth } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getCurrentUser);

export default router;
