import pool from '../config/database.js';

function splitContextLines(context) {
  return String(context || '')
    .split(/\r?\n|\s{2,}/)
    .map(line => line.trim())
    .filter(Boolean);
}

function supportFromContext(row) {
  if (row.support || !row.context || !row.docType) return row.support || null;

  const lines = splitContextLines(row.context);
  const fallbackTitle = row.docType
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase());

  if (row.docType === 'sms') {
    const first = lines[0] || 'Message';
    const fromMatch = first.match(/^(?:De\s*:\s*)?([^:]{2,30})\s*:\s*(.+)$/i);
    return {
      kind: 'sms',
      visual: null,
      message: {
        from: fromMatch ? fromMatch[1].trim() : 'Message',
        subject: null,
        lines: fromMatch ? [fromMatch[2].trim(), ...lines.slice(1)] : lines,
      },
      audio: null,
    };
  }

  if (row.docType === 'courriel' || row.docType === 'lettre' || row.docType === 'article') {
    let from = row.docType === 'article' ? 'Document' : 'Expéditeur';
    let subject = null;
    const body = [];

    for (const line of lines) {
      const fromMatch = line.match(/^De\s*:\s*(.+)$/i);
      const subjectMatch = line.match(/^(?:Objet|Sujet)\s*:\s*(.+)$/i);
      if (fromMatch) from = fromMatch[1].trim();
      else if (subjectMatch) subject = subjectMatch[1].trim();
      else body.push(line);
    }

    return {
      kind: row.docType,
      visual: null,
      message: { from, subject, lines: body.length ? body : lines },
      audio: null,
    };
  }

  const visualKind = row.docType === 'panneau' ? 'panneau'
    : row.docType === 'affiche' ? 'affiche'
      : 'annonce';
  const style = row.docType === 'horaire' ? 'transport'
    : row.docType === 'menu' || row.docType === 'publicite' ? 'commercial'
      : 'administratif';

  return {
    kind: visualKind,
    visual: {
      title: DOC_TYPE_TITLES[row.docType] || fallbackTitle,
      body: lines,
      meta: null,
      style,
    },
    message: null,
    audio: null,
  };
}

const DOC_TYPE_TITLES = {
  affiche: 'Affiche',
  annonce: 'Annonce',
  panneau: 'Panneau',
  menu: 'Menu',
  horaire: 'Horaire',
  document_administratif: 'Document administratif',
  publicite: 'Publicité',
};

function publicExercise(row) {
  return {
    ...row,
    support: supportFromContext(row),
  };
}


// ═══════════════════════════════════════════════════════════
// GET ALL EXERCISES (avec filtres)
// ═══════════════════════════════════════════════════════════
export const getAllExercises = async (req, res) => {
  try {
    const { category, level, type, docType, limit, offset } = req.query;
    
    let query = `
      SELECT 
        e.*,
        e.doc_type AS "docType",
        c.name as category_name,
        c.slug as category_slug,
        c.icon_color
      FROM exercises e
      JOIN categories c ON e.category_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (category) {
      query += ` AND c.slug = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    if (level) {
      query += ` AND e.level = $${paramCount}`;
      params.push(level.toUpperCase());
      paramCount++;
    }
    
    if (type) {
      query += ` AND e.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (docType) {
      query += ` AND e.doc_type = $${paramCount}`;
      params.push(docType);
      paramCount++;
    }
    
    const parsedLimit = parseInt(limit);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      query += ' ORDER BY RANDOM()';
    } else {
      query += ' ORDER BY e.level, e.difficulty';
    }

    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      query += ` LIMIT $${paramCount}`;
      params.push(parsedLimit);
      paramCount++;
    }
    
    const parsedOffset = parseInt(offset);
    if (!isNaN(parsedOffset) && parsedOffset >= 0) {
      query += ` OFFSET $${paramCount}`;
      params.push(parsedOffset);
    }
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(publicExercise)
    });
    
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des exercices'
    });
  }
};

// ═══════════════════════════════════════════════════════════
// GET EXERCISES WITH USER STATUS (individual library view)
// ═══════════════════════════════════════════════════════════
export const getExercisesWithStatus = async (req, res) => {
  try {
    const { category, level, type, docType } = req.query;
    const userId = req.user?.id || null;

    const params = [userId];
    let paramCount = 2;
    let conditions = 'WHERE 1=1';

    if (category) {
      conditions += ` AND c.slug = $${paramCount++}`;
      params.push(category);
    }
    if (level) {
      conditions += ` AND e.level = $${paramCount++}`;
      params.push(level.toUpperCase());
    }
    if (type) {
      conditions += ` AND e.type = $${paramCount++}`;
      params.push(type);
    }
    if (docType) {
      conditions += ` AND e.doc_type = $${paramCount++}`;
      params.push(docType);
    }

    const query = `
      SELECT
        e.id,
        e.type,
        e.level,
        e.difficulty,
        e.prompt,
        e.context,
        e.support,
        e.doc_type AS "docType",
        e.tags,
        c.name  AS category_name,
        c.slug  AS category_slug,
        c.icon_color,
        (SELECT MAX(percentage)::NUMERIC
           FROM exercise_attempts
          WHERE user_id = $1 AND exercise_id = e.id
        ) AS last_score,
        (SELECT MAX(percentage)::NUMERIC
           FROM exercise_attempts
          WHERE user_id = $1 AND exercise_id = e.id
        ) AS best_score,
        (SELECT COUNT(*)::int
           FROM exercise_attempts
          WHERE user_id = $1 AND exercise_id = e.id
        ) AS attempt_count
      FROM exercises e
      JOIN categories c ON e.category_id = c.id
      ${conditions}
      ORDER BY c.name, e.level, e.difficulty
    `;

    const result = await pool.query(query, params);
    res.json({ success: true, count: result.rows.length, data: result.rows.map(publicExercise) });
  } catch (error) {
    console.error('Error fetching exercises with status:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des exercices' });
  }
};

// ═══════════════════════════════════════════════════════════
// GET EXERCISES GROUPED BY CATEGORY AND LEVEL
// ═══════════════════════════════════════════════════════════
export const getExercisesGrouped = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.name as category_name,
        c.slug as category_slug,
        c.icon_color,
        e.level,
        COUNT(*) as exercise_count,
        ARRAY_AGG(e.id) as exercise_ids
      FROM exercises e
      JOIN categories c ON e.category_id = c.id
      GROUP BY c.name, c.slug, c.icon_color, e.level
      ORDER BY e.level, c.name
    `;
    
    const result = await pool.query(query);
    
    // Group by category and level
    const grouped = result.rows.reduce((acc, row) => {
      const key = `${row.category_slug}_${row.level}`;
      acc[key] = {
        category: {
          name: row.category_name,
          slug: row.category_slug,
          color: row.icon_color
        },
        level: row.level,
        count: parseInt(row.exercise_count),
        exerciseIds: row.exercise_ids
      };
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: grouped
    });
    
  } catch (error) {
    console.error('Error grouping exercises:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du regroupement des exercices'
    });
  }
};

// ═══════════════════════════════════════════════════════════
// GET EXERCISE COUNT (public — used by Footer)
// ═══════════════════════════════════════════════════════════
export const getExerciseCount = async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*)::int AS total FROM exercises');
    res.json({ success: true, total: result.rows[0].total });
  } catch (error) {
    console.error('Error counting exercises:', error);
    res.status(500).json({ success: false, total: 0 });
  }
};

// ═══════════════════════════════════════════════════════════
// GET SINGLE EXERCISE BY ID
// ═══════════════════════════════════════════════════════════
export const getExerciseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        e.*,
        e.doc_type AS "docType",
        c.name as category_name,
        c.slug as category_slug,
        c.icon_color
      FROM exercises e
      JOIN categories c ON e.category_id = c.id
      WHERE e.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exercice non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: publicExercise(result.rows[0])
    });
    
  } catch (error) {
    console.error('Error fetching exercise:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'exercice'
    });
  }
};

// ═══════════════════════════════════════════════════════════
// SUBMIT EXERCISE ATTEMPT
// ═══════════════════════════════════════════════════════════
export const submitAttempt = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id; // From auth middleware
    const { exerciseId, score, maxScore, percentage, timeSpent, answers } = req.body;
    
    await client.query('BEGIN');
    
    // Get exercise info to link category and level
    const exerciseRes = await client.query(
      'SELECT category_id, level FROM exercises WHERE id = $1',
      [exerciseId]
    );
    
    const { category_id = null, level = null } = exerciseRes.rows[0] || {};
    
    // Insert attempt
    const attemptResult = await client.query(
      `INSERT INTO exercise_attempts (
        user_id, exercise_id, category_id, level, score, max_score, percentage, time_spent, answers
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [userId, exerciseId, category_id, level, score, maxScore, percentage, timeSpent, JSON.stringify(answers)]
    );
    
    // Update user progress if exercise found
    if (category_id && level) {
      await client.query(
        `INSERT INTO user_progress (user_id, category_id, level, completed_exercises, average_score)
         VALUES ($1, $2, $3, 1, $4)
         ON CONFLICT (user_id, category_id, level)
         DO UPDATE SET
           completed_exercises = user_progress.completed_exercises + 1,
           average_score = (user_progress.average_score * user_progress.completed_exercises + $4) / (user_progress.completed_exercises + 1),
           last_activity = CURRENT_TIMESTAMP`,
        [userId, category_id, level, percentage]
      );
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      attemptId: attemptResult.rows[0].id,
      message: 'Tentative enregistrée avec succès'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement de la tentative'
    });
  } finally {
    client.release();
  }
};

// ═══════════════════════════════════════════════════════════
// GET CATEGORIES
// ═══════════════════════════════════════════════════════════
export const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories ORDER BY name'
    );
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories'
    });
  }
};
