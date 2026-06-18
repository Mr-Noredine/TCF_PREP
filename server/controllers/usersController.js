import pool from '../config/database.js';

// ═══════════════════════════════════════════════════════════
// GET USER PROGRESS
// ═══════════════════════════════════════════════════════════
export const getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `WITH best_attempts AS (
        SELECT exercise_id, MAX(percentage)::NUMERIC AS best_percentage
        FROM exercise_attempts
        WHERE user_id = $1
        GROUP BY exercise_id
      )
      SELECT
        c.id as category_id,
        c.name as category_name,
        c.slug as category_slug,
        c.icon_color,
        e.level,
        COUNT(DISTINCT e.id)::int as total_exercises,
        COUNT(DISTINCT e.id) FILTER (WHERE ba.best_percentage IS NOT NULL)::int as completed_exercises,
        COALESCE(AVG(ba.best_percentage) FILTER (WHERE ba.best_percentage IS NOT NULL), 0) as average_score
      FROM exercises e
      JOIN categories c ON e.category_id = c.id
      LEFT JOIN best_attempts ba ON ba.exercise_id = e.id
      GROUP BY c.id, c.name, c.slug, c.icon_color, e.level
      HAVING COUNT(DISTINCT e.id) FILTER (WHERE ba.best_percentage IS NOT NULL) > 0
      ORDER BY c.name, e.level`,
      [userId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la progression'
    });
  }
};

// ═══════════════════════════════════════════════════════════
// GET USER ATTEMPTS HISTORY
// ═══════════════════════════════════════════════════════════
export const getUserAttempts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;
    
    const result = await pool.query(
      `SELECT 
        ea.*,
        e.prompt as exercise_prompt,
        ea.level,
        c.name as category_name,
        c.slug as category_slug
      FROM exercise_attempts ea
      LEFT JOIN exercises e ON ea.exercise_id = e.id
      LEFT JOIN categories c ON ea.category_id = c.id
      WHERE ea.user_id = $1
      ORDER BY ea.completed_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching user attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
};

// ═══════════════════════════════════════════════════════════
// GET USER STATS
// ═══════════════════════════════════════════════════════════
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await pool.query(
      `WITH best_attempts AS (
        SELECT exercise_id, MAX(percentage)::NUMERIC AS best_percentage
        FROM exercise_attempts
        WHERE user_id = $1
        GROUP BY exercise_id
      ), time_totals AS (
        SELECT COALESCE(SUM(time_spent), 0) as total_time_spent,
               COUNT(*) as total_attempts
        FROM exercise_attempts
        WHERE user_id = $1
      )
      SELECT
        COUNT(*)::int as total_exercises_completed,
        (SELECT total_attempts FROM time_totals)::int as total_attempts,
        COALESCE(AVG(best_percentage), 0) as average_score,
        (SELECT total_time_spent FROM time_totals) as total_time_spent,
        COUNT(*) FILTER (WHERE best_percentage >= 70)::int as successful_count
      FROM best_attempts`,
      [userId]
    );
    
    const categoryStats = await pool.query(
      `WITH best_attempts AS (
        SELECT ea.exercise_id, MAX(ea.percentage)::NUMERIC AS best_percentage
        FROM exercise_attempts ea
        WHERE ea.user_id = $1
        GROUP BY ea.exercise_id
      )
      SELECT
        c.name as category,
        COUNT(ba.exercise_id)::int as attempts,
        COALESCE(AVG(ba.best_percentage), 0) as avg_score
      FROM best_attempts ba
      JOIN exercises e ON e.id = ba.exercise_id
      JOIN categories c ON c.id = e.category_id
      GROUP BY c.name
      ORDER BY c.name`,
      [userId]
    );
    
    res.json({
      success: true,
      overall: stats.rows[0],
      byCategory: categoryStats.rows
    });
    
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// Get progress timeline (last 30 days)
export const getProgressTimeline = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        DATE(completed_at) as date,
        COUNT(*) as total_attempts,
        AVG(percentage) as avg_score,
        SUM(CASE WHEN percentage >= 70 THEN 1 ELSE 0 END) as successful_attempts
      FROM exercise_attempts
      WHERE user_id = $1
        AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(completed_at)
      ORDER BY date ASC
    `;

    const result = await pool.query(query, [userId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching progress timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la progression'
    });
  }
};

// Get recommendations based on performance
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    const progressCte = `
      WITH best_attempts AS (
        SELECT exercise_id, MAX(percentage)::NUMERIC AS best_percentage
        FROM exercise_attempts
        WHERE user_id = $1
        GROUP BY exercise_id
      ), progress AS (
        SELECT
          c.name,
          c.slug,
          e.category_id,
          e.level,
          COUNT(DISTINCT e.id)::int as total_exercises,
          COUNT(DISTINCT e.id) FILTER (WHERE ba.best_percentage IS NOT NULL)::int as completed_exercises,
          COALESCE(AVG(ba.best_percentage) FILTER (WHERE ba.best_percentage IS NOT NULL), 0) as average_score
        FROM exercises e
        JOIN categories c ON c.id = e.category_id
        LEFT JOIN best_attempts ba ON ba.exercise_id = e.id
        GROUP BY c.name, c.slug, e.category_id, e.level
      )
    `;

    const weakAreasQuery = `
      ${progressCte}
      SELECT name, slug, level, average_score, completed_exercises, total_exercises
      FROM progress
      WHERE average_score < 60
        AND completed_exercises > 0
      ORDER BY average_score ASC
      LIMIT 3
    `;

    const strongAreasQuery = `
      ${progressCte}
      SELECT name, slug, level, average_score, completed_exercises, total_exercises
      FROM progress
      WHERE average_score >= 80
        AND completed_exercises > 0
      ORDER BY average_score DESC
      LIMIT 3
    `;

    const nextLevelQuery = `
      ${progressCte}
      SELECT name, slug, level, average_score, completed_exercises, total_exercises
      FROM progress
      WHERE average_score >= 75
        AND completed_exercises >= 5
      ORDER BY
        CASE level
          WHEN 'A1' THEN 1
          WHEN 'A2' THEN 2
          WHEN 'B1' THEN 3
          WHEN 'B2' THEN 4
          WHEN 'C1' THEN 5
          WHEN 'C2' THEN 6
        END ASC
      LIMIT 3
    `;

    const [weakAreas, strongAreas, nextLevel] = await Promise.all([
      pool.query(weakAreasQuery, [userId]),
      pool.query(strongAreasQuery, [userId]),
      pool.query(nextLevelQuery, [userId])
    ]);

    res.json({
      success: true,
      data: {
        weakAreas: weakAreas.rows,
        strongAreas: strongAreas.rows,
        nextLevel: nextLevel.rows
      }
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recommandations'
    });
  }
};