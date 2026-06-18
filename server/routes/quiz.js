import express from 'express';
import { getQuizQuestions, submitQuizAttempt } from '../controllers/quizController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/quiz?category=grammar&level=A1&limit=25
router.get('/', getQuizQuestions);

// POST /api/quiz/attempt (PROTECTED)
router.post('/attempt', protect, submitQuizAttempt);

export default router;
