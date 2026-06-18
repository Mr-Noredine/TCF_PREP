import pool from '../config/database.js';

// ═══════════════════════════════════════════════════════════
// GET RANDOM QUIZ QUESTIONS
// ═══════════════════════════════════════════════════════════
export const getQuizQuestions = async (req, res) => {
  try {
    const { category, level, limit = 25 } = req.query;
    
    if (!category || !level) {
      return res.status(400).json({
        success: false,
        message: 'Catégorie et niveau requis'
      });
    }
    
    const query = `
      SELECT 
        e.*,
        c.name as category_name,
        c.slug as category_slug
      FROM exercises e
      JOIN categories c ON e.category_id = c.id
      WHERE c.slug = $1 AND e.level = $2
      ORDER BY RANDOM()
      LIMIT $3
    `;
    
    const result = await pool.query(query, [category, level.toUpperCase(), parseInt(limit)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucune question trouvée pour cette catégorie et ce niveau'
      });
    }
    
    res.json({
      success: true,
      count: result.rows.length,
      quiz: {
        category: result.rows[0].category_name,
        categorySlug: result.rows[0].category_slug,
        level: level.toUpperCase(),
        questions: result.rows
      }
    });
    
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des questions'
    });
  }
};

// ═══════════════════════════════════════════════════════════
// SUBMIT QUIZ ATTEMPT
// ═══════════════════════════════════════════════════════════
export const submitQuizAttempt = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id; // From auth middleware
    const { category, level, score, totalQuestions, percentage, timeSpent, answers } = req.body;
    
    await client.query('BEGIN');
    
    // Get category ID
    const categoryResult = await client.query(
      'SELECT id FROM categories WHERE slug = $1',
      [category]
    );
    
    if (categoryResult.rows.length === 0) {
      throw new Error('Catégorie non trouvée');
    }
    
    const categoryId = categoryResult.rows[0].id;
    
    // Insert quiz attempt (using exercise_attempts table)
    const attemptResult = await client.query(
      `INSERT INTO exercise_attempts (
        user_id, exercise_id, category_id, level, score, max_score, percentage, time_spent, answers
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        userId,
        `quiz_${category}_${level}_${Date.now()}`, // Unique quiz ID
        categoryId,
        level,
        score,
        totalQuestions,
        percentage,
        timeSpent,
        JSON.stringify(answers)
      ]
    );
    
    // Update user progress
    await client.query(
      `INSERT INTO user_progress (user_id, category_id, level, total_exercises, completed_exercises, average_score)
       VALUES ($1, $2, $3, 1, 1, $4)
       ON CONFLICT (user_id, category_id, level)
       DO UPDATE SET
         total_exercises = user_progress.total_exercises + 1,
         completed_exercises = user_progress.completed_exercises + 1,
         average_score = (user_progress.average_score * user_progress.completed_exercises + $4) / (user_progress.completed_exercises + 1),
         last_activity = CURRENT_TIMESTAMP`,
      [userId, categoryId, level, percentage]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      attemptId: attemptResult.rows[0].id,
      message: 'Quiz enregistré avec succès'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting quiz attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement du quiz'
    });
  } finally {
    client.release();
  }
};
