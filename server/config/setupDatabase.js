import pool from './database.js';

const setupDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Création du schéma de base de données...\n');

    // Table users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        firstname VARCHAR(100) NOT NULL,
        lastname VARCHAR(100) NOT NULL,
        level VARCHAR(10) DEFAULT 'A1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Table users créée');

    // Table categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        icon_color VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Table categories créée');

    // Table exercises
    await client.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id VARCHAR(100) PRIMARY KEY,
        exam VARCHAR(20) DEFAULT 'TCF',
        level VARCHAR(10) NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        subcategory VARCHAR(100),
        type VARCHAR(50) NOT NULL,
        prompt TEXT NOT NULL,
        context TEXT,
        support JSONB,
        doc_type VARCHAR(50),
        choices JSONB,
        answer TEXT NOT NULL,
        explanation TEXT NOT NULL,
        distractors JSONB,
        tags TEXT[],
        difficulty INTEGER DEFAULT 1,
        language VARCHAR(10) DEFAULT 'fr',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Table exercises créée');

    // Table exercise_attempts
    await client.query(`
      CREATE TABLE IF NOT EXISTS exercise_attempts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        exercise_id VARCHAR(100),
        category_id INTEGER REFERENCES categories(id),
        level VARCHAR(10),
        score INTEGER NOT NULL,
        max_score INTEGER NOT NULL,
        percentage DECIMAL(5,2),
        time_spent INTEGER,
        answers JSONB,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Table exercise_attempts créée');

    // Table user_progress
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id),
        level VARCHAR(10),
        total_exercises INTEGER DEFAULT 0,
        completed_exercises INTEGER DEFAULT 0,
        average_score DECIMAL(5,2) DEFAULT 0,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, category_id, level)
      );
    `);
    console.log('✓ Table user_progress créée');

    // Index pour optimisation
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category_id);
      CREATE INDEX IF NOT EXISTS idx_exercises_level ON exercises(level);
      CREATE INDEX IF NOT EXISTS idx_attempts_user ON exercise_attempts(user_id);
      CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
    `);
    console.log('✓ Index créés');

    console.log('\n✅ Schéma de base de données créé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du schéma:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default setupDatabase;
