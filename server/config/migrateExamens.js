import pool from './database.js';

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('Running Exam Blanc migration...\n');

    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_sessions (
        id               SERIAL PRIMARY KEY,
        user_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
        format           VARCHAR(20)  NOT NULL,
        total_time       INTEGER      NOT NULL,
        started_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        completed_at     TIMESTAMP,
        status           VARCHAR(20)  DEFAULT 'en_cours',
        score            INTEGER,
        total_questions  INTEGER,
        percentage       DECIMAL(5,2),
        level_estimate   VARCHAR(20),
        score_by_epreuve JSONB,
        duration_seconds INTEGER
      );
    `);
    console.log('✓ exam_sessions created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_questions (
        id             SERIAL PRIMARY KEY,
        session_id     INTEGER REFERENCES exam_sessions(id) ON DELETE CASCADE,
        question_order INTEGER NOT NULL,
        exercise_id    VARCHAR(100) REFERENCES exercises(id),
        epreuve        VARCHAR(30) NOT NULL,
        level          VARCHAR(10) NOT NULL,
        UNIQUE(session_id, question_order)
      );
    `);
    console.log('✓ exam_questions created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS exam_answers (
        id             SERIAL PRIMARY KEY,
        session_id     INTEGER REFERENCES exam_sessions(id) ON DELETE CASCADE,
        question_order INTEGER NOT NULL,
        answer_given   TEXT,
        answered_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(session_id, question_order)
      );
    `);
    console.log('✓ exam_answers created');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_exam_sessions_user ON exam_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_exam_questions_session ON exam_questions(session_id);
      CREATE INDEX IF NOT EXISTS idx_exam_answers_session ON exam_answers(session_id);
    `);
    await client.query(`
      ALTER TABLE exercises
      ADD COLUMN IF NOT EXISTS support JSONB;
    `);
    await client.query(`
      ALTER TABLE exercises
      ADD COLUMN IF NOT EXISTS doc_type VARCHAR(50);
    `);
    await client.query(`
      ALTER TABLE exercises
      ADD COLUMN IF NOT EXISTS distractors JSONB;
    `);
    console.log('✓ exercises.support/doc_type/distractors ready');

    console.log('✓ indexes created');

    console.log('\n✅ Exam Blanc migration complete.');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default migrate;
