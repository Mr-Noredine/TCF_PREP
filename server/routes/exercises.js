import express from 'express';
import {
  getAllExercises,
  getExercisesWithStatus,
  getExercisesGrouped,
  getExerciseById,
  submitAttempt,
  getCategories,
  getExerciseCount,
} from '../controllers/exercisesController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/exercises/count - Total exercise count (public)
router.get('/count', getExerciseCount);

// GET /api/exercises/list - Individual exercises with user status
router.get('/list', optionalAuth, getExercisesWithStatus);

// GET /api/exercises/grouped - Exercises grouped by category/level
router.get('/grouped', getExercisesGrouped);

// GET /api/exercises/categories - All categories
router.get('/categories', getCategories);

// GET /api/exercises - All exercises (with filters)
router.get('/', getAllExercises);

// GET /api/exercises/:id - Single exercise
router.get('/:id', getExerciseById);

// POST /api/exercises/attempt - Submit attempt (protected)
router.post('/attempt', protect, submitAttempt);

export default router;
