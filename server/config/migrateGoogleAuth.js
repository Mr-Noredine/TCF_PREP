import pool from './database.js';

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('Running Google Auth migration...\n');

    await client.query(`
      ALTER TABLE users
        ALTER COLUMN password DROP NOT NULL;
    `);
    console.log('✓ password column is now nullable');

    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
    `);
    console.log('✓ google_id column added');

    console.log('\n✅ Migration complete.');
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
