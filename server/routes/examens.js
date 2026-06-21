import express from 'express';
import {
  createExamen,
  getSession,
  submitAnswer,
  terminerExamen,
  getResultats,
  getHistory,
  getLastLevel,
} from '../controllers/examensController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All exam routes require authentication
router.use(protect);

router.post('/',                        createExamen);
router.get('/historique',               getHistory);
router.get('/last-level',               getLastLevel);
router.get('/:sessionId',               getSession);
router.post('/:sessionId/reponse',      submitAnswer);
router.post('/:sessionId/terminer',     terminerExamen);
router.get('/:sessionId/resultats',     getResultats);

export default router;
