import pool from './database.js';

const migrateAll = async () => {
  const client = await pool.connect();
  try {
    console.log('🔧 Migration complète TCF Prep\n');

    // ── 1. Tables de base ───────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        email      VARCHAR(255) UNIQUE NOT NULL,
        password   VARCHAR(255),
        firstname  VARCHAR(100) NOT NULL,
        lastname   VARCHAR(100) NOT NULL,
        level      VARCHAR(10)  DEFAULT 'A1',
        google_id  VARCHAR(255) UNIQUE,
        created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ users');

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        slug        VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        icon_color  VARCHAR(20),
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ categories');

    await client.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id          VARCHAR(100) PRIMARY KEY,
        exam        VARCHAR(20)  DEFAULT 'TCF',
        level       VARCHAR(10)  NOT NULL,
        category_id INTEGER      REFERENCES categories(id),
        subcategory VARCHAR(100),
        type        VARCHAR(50)  NOT NULL,
        prompt      TEXT         NOT NULL,
        context     TEXT,
        support     JSONB,
        doc_type    VARCHAR(50),
        choices     JSONB,
        answer      TEXT         NOT NULL,
        explanation TEXT         NOT NULL,
        distractors JSONB,
        tags        TEXT[],
        difficulty  INTEGER      DEFAULT 1,
        language    VARCHAR(10)  DEFAULT 'fr',
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ exercises');

    await client.query(`
      CREATE TABLE IF NOT EXISTS exercise_attempts (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
        exercise_id VARCHAR(100),
        category_id INTEGER REFERENCES categories(id),
        level       VARCHAR(10),
        score       INTEGER      NOT NULL,
        max_score   INTEGER      NOT NULL,
        percentage  DECIMAL(5,2),
        time_spent  INTEGER,
        answers     JSONB,
        completed_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ exercise_attempts');

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_progress (
        id                  SERIAL PRIMARY KEY,
        user_id             INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category_id         INTEGER REFERENCES categories(id),
        level               VARCHAR(10),
        total_exercises     INTEGER      DEFAULT 0,
        completed_exercises INTEGER      DEFAULT 0,
        average_score       DECIMAL(5,2) DEFAULT 0,
        last_activity       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, category_id, level)
      );
    `);
    console.log('✓ user_progress');

    // ── 2. Tables examen blanc ──────────────────────────────────────────────
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
    console.log('✓ exam_sessions');

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
    console.log('✓ exam_questions');

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
    console.log('✓ exam_answers');

    // ── 3. Colonnes optionnelles (idempotent) ───────────────────────────────
    await client.query(`ALTER TABLE users ALTER COLUMN password DROP NOT NULL;`);
    console.log('✓ users.password nullable (Google OAuth)');

    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;`);
    await client.query(`ALTER TABLE exercises ADD COLUMN IF NOT EXISTS support    JSONB;`);
    await client.query(`ALTER TABLE exercises ADD COLUMN IF NOT EXISTS doc_type   VARCHAR(50);`);
    await client.query(`ALTER TABLE exercises ADD COLUMN IF NOT EXISTS distractors JSONB;`);
    console.log('✓ colonnes supplémentaires');

    // ── 4. Index ────────────────────────────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_exercises_category    ON exercises(category_id);
      CREATE INDEX IF NOT EXISTS idx_exercises_level       ON exercises(level);
      CREATE INDEX IF NOT EXISTS idx_attempts_user         ON exercise_attempts(user_id);
      CREATE INDEX IF NOT EXISTS idx_progress_user         ON user_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_exam_sessions_user    ON exam_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_exam_questions_session ON exam_questions(session_id);
      CREATE INDEX IF NOT EXISTS idx_exam_answers_session  ON exam_answers(session_id);
    `);
    console.log('✓ index');

    console.log('\n✅ Migration complète terminée avec succès !');
  } catch (err) {
    console.error('\n❌ Erreur migration:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAll().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default migrateAll;
