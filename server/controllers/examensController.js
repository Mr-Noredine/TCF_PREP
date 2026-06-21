import pool from '../config/database.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const PASS_THRESHOLD = 0.70;

const FORMAT_CONFIG = {
  complet: { total_time: 2400, co: 11, ce: 18, sl: 11 },
  express: { total_time: 900,  co: 4,  ce: 6,  sl: 5  },
};

// CO = listening_comprehension ; CE = reading_comprehension ; SL = grammar + conjugation + vocabulary
const EPREUVE_CATEGORIES = {
  comprehension_orale:  ['listening_comprehension'],
  comprehension_ecrite: ['reading_comprehension'],
  structures_langue:    ['grammar', 'conjugation', 'vocabulary'],
};

const EPREUVE_ORDER = ['comprehension_orale', 'structures_langue', 'comprehension_ecrite'];
const LEVEL_RANK = Object.fromEntries(LEVELS.map((level, index) => [level, index]));

// ── Helpers ───────────────────────────────────────────────────────────────────

function levelQuota(count) {
  const groups = {
    A: Math.round(count * 0.4),
    C: count >= 4 ? Math.max(1, Math.round(count * 0.2)) : 0,
  };
  groups.B = Math.max(0, count - groups.A - groups.C);

  const quota = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
  const spread = (levels, amount) => {
    for (let i = 0; i < amount; i++) quota[levels[i % levels.length]]++;
  };

  spread(['A1', 'A2'], groups.A);
  spread(['B1', 'B2'], groups.B);
  spread(['C1', 'C2'], groups.C);
  return quota;
}

function sortProgressive(a, b) {
  return (LEVEL_RANK[a.level] ?? 99) - (LEVEL_RANK[b.level] ?? 99);
}

function encodeAudioToken(transcript) {
  return Buffer.from(transcript || '', 'utf8').toString('base64');
}

function toJson(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (_) { return null; }
  }
  return value;
}

function publicSupport(rawSupport) {
  const support = toJson(rawSupport);
  if (!support) return null;

  if ((support.kind === 'audio' || support.kind === 'dialogue') && support.audio) {
    const { transcript, ...audioRest } = support.audio;
    return {
      ...support,
      audio: {
        ...audioRest,
        token: encodeAudioToken(transcript),
      },
    };
  }

  return support;
}

// Pick questions with an approximate TCF level balance: 40% A, 40% B, 20% C.
async function pickQuestions(client, categorySlugs, count, epreuve) {
  const selected = [];
  const usedIds = [];
  const quota = levelQuota(count);

  for (const [level, amount] of Object.entries(quota)) {
    if (amount <= 0) continue;
    const result = await client.query(
      `SELECT e.id, e.level
       FROM exercises e
       JOIN categories c ON e.category_id = c.id
       WHERE c.slug = ANY($1) AND e.type = 'mcq' AND e.level = $2
       ORDER BY RANDOM()
       LIMIT $3`,
      [categorySlugs, level, amount]
    );
    selected.push(...result.rows);
    usedIds.push(...result.rows.map(r => r.id));
  }

  const remaining = count - selected.length;
  if (remaining > 0) {
    const fillResult = await client.query(
      `SELECT e.id, e.level
       FROM exercises e
       JOIN categories c ON e.category_id = c.id
       WHERE c.slug = ANY($1) AND e.type = 'mcq' AND NOT (e.id = ANY($2))
       ORDER BY RANDOM()
       LIMIT $3`,
      [categorySlugs, usedIds, remaining]
    );
    selected.push(...fillResult.rows);
  }

  return selected.slice(0, count).sort(sortProgressive).map(r => ({ ...r, epreuve }));
}

// Check whether a given answer index matches the exercise's stored answer
function isCorrect(exerciseAnswer, choices, givenAnswer) {
  if (givenAnswer === null || givenAnswer === undefined || givenAnswer === '') return false;

  const parsedChoices = typeof choices === 'string' ? JSON.parse(choices) : (choices || []);
  let correctIdx;

  if (!isNaN(parseInt(exerciseAnswer))) {
    correctIdx = parseInt(exerciseAnswer);
  } else {
    correctIdx = parsedChoices.findIndex(
      c => c.trim().toLowerCase() === exerciseAnswer.trim().toLowerCase()
    );
  }

  return parseInt(givenAnswer) === correctIdx;
}

// Compute cumulative CECRL level estimate
function estimateCECRL(byLevel) {
  let estimated = null;
  for (const lvl of LEVELS) {
    const data = byLevel[lvl];
    if (!data || data.total === 0) continue; // skip if no questions at this level
    if (data.correct / data.total >= PASS_THRESHOLD) {
      estimated = lvl;
    } else {
      break;
    }
  }
  return estimated || 'Inférieur à A1';
}

// Calculate results and persist them on the session row
async function computeAndSaveResults(sessionId) {
  const result = await pool.query(
    `SELECT eq.question_order, eq.epreuve, eq.level,
            e.answer, e.choices, e.type,
            ea.answer_given
     FROM exam_questions eq
     JOIN exercises e ON eq.exercise_id = e.id
     LEFT JOIN exam_answers ea
       ON ea.session_id = eq.session_id AND ea.question_order = eq.question_order
     WHERE eq.session_id = $1`,
    [sessionId]
  );

  const questions = result.rows;
  let totalCorrect = 0;
  const byLevel   = {};
  const byEpreuve = {};

  for (const q of questions) {
    const correct = isCorrect(q.answer, q.choices, q.answer_given);
    if (correct) totalCorrect++;

    if (!byLevel[q.level])   byLevel[q.level]   = { correct: 0, total: 0 };
    if (!byEpreuve[q.epreuve]) byEpreuve[q.epreuve] = { correct: 0, total: 0 };

    byLevel[q.level].total++;
    byEpreuve[q.epreuve].total++;
    if (correct) { byLevel[q.level].correct++; byEpreuve[q.epreuve].correct++; }
  }

  const levelEstimate = estimateCECRL(byLevel);
  const percentage    = questions.length
    ? Math.round((totalCorrect / questions.length) * 100)
    : 0;

  const scoreByEpreuve = {};
  for (const [ep, d] of Object.entries(byEpreuve)) {
    scoreByEpreuve[ep] = {
      correct:    d.correct,
      total:      d.total,
      percentage: Math.round((d.correct / d.total) * 100),
    };
  }

  // Duration
  const sessionRow = await pool.query(
    `SELECT started_at, total_time FROM exam_sessions WHERE id = $1`, [sessionId]
  );
  const { started_at, total_time } = sessionRow.rows[0];
  const elapsed  = Math.floor((Date.now() - new Date(started_at).getTime()) / 1000);
  const duration = Math.min(elapsed, total_time);

  await pool.query(
    `UPDATE exam_sessions SET
       status           = CASE WHEN status = 'en_cours' THEN 'termine' ELSE status END,
       completed_at     = COALESCE(completed_at, NOW()),
       score            = $1,
       total_questions  = $2,
       percentage       = $3,
       level_estimate   = $4,
       score_by_epreuve = $5,
       duration_seconds = $6
     WHERE id = $7`,
    [totalCorrect, questions.length, percentage, levelEstimate,
     JSON.stringify(scoreByEpreuve), duration, sessionId]
  );
}

// ── Controllers ───────────────────────────────────────────────────────────────

// POST /api/examens
export const createExamen = async (req, res) => {
  const { format } = req.body;
  const userId = req.user.id;

  const config = FORMAT_CONFIG[format];
  if (!config) {
    return res.status(400).json({ success: false, message: 'Format invalide (complet ou express)' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sessionRes = await client.query(
      `INSERT INTO exam_sessions (user_id, format, total_time, status)
       VALUES ($1, $2, $3, 'en_cours')
       RETURNING id, started_at, total_time, format, status`,
      [userId, format, config.total_time]
    );
    const session = sessionRes.rows[0];

    const coQuestions = await pickQuestions(
      client, EPREUVE_CATEGORIES.comprehension_orale, config.co, 'comprehension_orale'
    );
    const ceQuestions = await pickQuestions(
      client, EPREUVE_CATEGORIES.comprehension_ecrite, config.ce, 'comprehension_ecrite'
    );
    const slQuestions = await pickQuestions(
      client, EPREUVE_CATEGORIES.structures_langue, config.sl, 'structures_langue'
    );

    const allQuestions = [...coQuestions, ...slQuestions, ...ceQuestions]
      .sort((a, b) => EPREUVE_ORDER.indexOf(a.epreuve) - EPREUVE_ORDER.indexOf(b.epreuve)
        || sortProgressive(a, b));

    for (let i = 0; i < allQuestions.length; i++) {
      await client.query(
        `INSERT INTO exam_questions (session_id, question_order, exercise_id, epreuve, level)
         VALUES ($1, $2, $3, $4, $5)`,
        [session.id, i + 1, allQuestions[i].id, allQuestions[i].epreuve, allQuestions[i].level]
      );
    }

    await client.query('COMMIT');

    // Return questions WITHOUT answer or explanation
    const questionsRes = await pool.query(
      `SELECT eq.question_order, eq.epreuve, eq.level,
              e.id AS exercise_id, e.prompt, e.context, e.choices, e.type, e.support
       FROM exam_questions eq
       JOIN exercises e ON eq.exercise_id = e.id
       WHERE eq.session_id = $1
       ORDER BY eq.question_order`,
      [session.id]
    );

    res.status(201).json({
      success: true,
      session: {
        id:         session.id,
        format:     session.format,
        total_time: session.total_time,
        started_at: session.started_at,
        status:     session.status,
      },
      questions: questionsRes.rows.map(q => ({ ...q, support: publicSupport(q.support) })),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createExamen error:', err);
    res.status(500).json({ success: false, message: 'Erreur lors de la création de l\'examen' });
  } finally {
    client.release();
  }
};

// GET /api/examens/:sessionId
export const getSession = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  const sessionRes = await pool.query(
    `SELECT id, user_id, format, total_time, started_at, completed_at, status
     FROM exam_sessions WHERE id = $1`,
    [sessionId]
  );

  if (!sessionRes.rows.length) {
    return res.status(404).json({ success: false, message: 'Session introuvable' });
  }

  const session = sessionRes.rows[0];
  if (session.user_id !== userId) {
    return res.status(403).json({ success: false, message: 'Accès refusé' });
  }

  // Recalculate remaining time from server clock
  const elapsed  = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
  const timeLeft = Math.max(0, session.total_time - elapsed);

  // Auto-expire if time has passed and session is still open
  if (timeLeft <= 0 && session.status === 'en_cours') {
    await pool.query(
      `UPDATE exam_sessions SET status = 'expire', completed_at = NOW() WHERE id = $1`,
      [sessionId]
    );
    await computeAndSaveResults(sessionId);
    return res.json({ success: true, session: { ...session, status: 'expire', time_left: 0 }, expired: true });
  }

  if (session.status !== 'en_cours') {
    return res.json({ success: true, session: { ...session, time_left: timeLeft }, finished: true });
  }

  const questionsRes = await pool.query(
    `SELECT eq.question_order, eq.epreuve, eq.level,
            e.id AS exercise_id, e.prompt, e.context, e.choices, e.type, e.support
     FROM exam_questions eq
     JOIN exercises e ON eq.exercise_id = e.id
     WHERE eq.session_id = $1
     ORDER BY eq.question_order`,
    [sessionId]
  );

  const answersRes = await pool.query(
    `SELECT question_order, answer_given FROM exam_answers WHERE session_id = $1`,
    [sessionId]
  );

  res.json({
    success:   true,
    session:   { ...session, time_left: timeLeft },
    questions: questionsRes.rows.map(q => ({ ...q, support: publicSupport(q.support) })),
    answers:   answersRes.rows,
  });
};

// POST /api/examens/:sessionId/reponse
export const submitAnswer = async (req, res) => {
  const { sessionId } = req.params;
  const { question_order, answer_given } = req.body;
  const userId = req.user.id;

  const sessionRes = await pool.query(
    `SELECT id, user_id, status, started_at, total_time FROM exam_sessions WHERE id = $1`,
    [sessionId]
  );

  if (!sessionRes.rows.length) {
    return res.status(404).json({ success: false, message: 'Session introuvable' });
  }
  const session = sessionRes.rows[0];
  if (session.user_id !== userId)     return res.status(403).json({ success: false });
  if (session.status !== 'en_cours')  return res.status(400).json({ success: false, message: 'Session non active' });

  const elapsed = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
  if (elapsed > session.total_time + 15) {
    return res.status(400).json({ success: false, message: 'Temps écoulé' });
  }

  // Lock answer — ON CONFLICT DO NOTHING prevents overwriting (no back button)
  await pool.query(
    `INSERT INTO exam_answers (session_id, question_order, answer_given)
     VALUES ($1, $2, $3)
     ON CONFLICT (session_id, question_order) DO NOTHING`,
    [sessionId, question_order, answer_given?.toString() ?? null]
  );

  res.json({ success: true, time_left: Math.max(0, session.total_time - elapsed) });
};

// POST /api/examens/:sessionId/terminer
export const terminerExamen = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  const sessionRes = await pool.query(
    `SELECT id, user_id, status FROM exam_sessions WHERE id = $1`, [sessionId]
  );
  if (!sessionRes.rows.length) return res.status(404).json({ success: false });
  const session = sessionRes.rows[0];
  if (session.user_id !== userId) return res.status(403).json({ success: false });

  if (session.status === 'en_cours' || session.status === 'expire') {
    await computeAndSaveResults(sessionId);
  }

  res.json({ success: true, session_id: parseInt(sessionId) });
};

// GET /api/examens/:sessionId/resultats
export const getResultats = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  let sessionRes = await pool.query(`SELECT * FROM exam_sessions WHERE id = $1`, [sessionId]);
  if (!sessionRes.rows.length) return res.status(404).json({ success: false });
  let session = sessionRes.rows[0];
  if (session.user_id !== userId) return res.status(403).json({ success: false });

  // Ensure results are computed
  if (session.status === 'en_cours' || session.status === 'expire' || !session.level_estimate) {
    await computeAndSaveResults(sessionId);
    sessionRes = await pool.query(`SELECT * FROM exam_sessions WHERE id = $1`, [sessionId]);
    session = sessionRes.rows[0];
  }

  // Return questions WITH answer + explanation (only here)
  const questionsRes = await pool.query(
    `SELECT eq.question_order, eq.epreuve, eq.level,
            e.id AS exercise_id, e.prompt, e.context, e.choices, e.type, e.support,
            e.answer, e.explanation, e.distractors
     FROM exam_questions eq
     JOIN exercises e ON eq.exercise_id = e.id
     WHERE eq.session_id = $1
     ORDER BY eq.question_order`,
    [sessionId]
  );

  const answersRes = await pool.query(
    `SELECT question_order, answer_given FROM exam_answers WHERE session_id = $1`, [sessionId]
  );

  res.json({
    success:   true,
    session,
    questions: questionsRes.rows,
    answers:   answersRes.rows,
  });
};

// GET /api/examens  — user's completed exam history
export const getHistory = async (req, res) => {
  const userId = req.user.id;
  const { limit = 5 } = req.query;

  const result = await pool.query(
    `SELECT id, format, score, total_questions, percentage, level_estimate,
            duration_seconds, completed_at, status
     FROM exam_sessions
     WHERE user_id = $1 AND status IN ('termine', 'expire')
     ORDER BY completed_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  res.json({ success: true, data: result.rows });
};

// GET /api/examens/last-level — most recent level estimate (for dashboard badge)
export const getLastLevel = async (req, res) => {
  const userId = req.user.id;

  // Only count exams where the user answered at least 80 % of questions.
  // This avoids "Inférieur à A1" from abandoned or timer-expired sessions with 1-2 answers.
  const result = await pool.query(
    `SELECT s.level_estimate, s.completed_at
     FROM exam_sessions s
     WHERE s.user_id = $1
       AND s.status = 'termine'
       AND s.level_estimate IS NOT NULL
       AND s.total_questions > 0
       AND (
         SELECT COUNT(*) FROM exam_answers ea WHERE ea.session_id = s.id
       ) >= s.total_questions * 0.8
     ORDER BY s.completed_at DESC
     LIMIT 1`,
    [userId]
  );

  res.json({
    success: true,
    level:   result.rows[0]?.level_estimate || null,
    date:    result.rows[0]?.completed_at   || null,
  });
};
