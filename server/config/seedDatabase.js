import pool from './database.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildDistractors } from '../utils/distractorRules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const READING_DOC_TYPES = new Set([
  'sms', 'courriel', 'lettre', 'affiche', 'annonce', 'panneau',
  'menu', 'article', 'horaire', 'document_administratif', 'publicite',
]);
const LISTENING_DOC_TYPES = new Set(['dialogue', 'annonce_audio', 'message_vocal', 'interview', 'bulletin']);

function normalizeText(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function deriveDocType(item) {
  if (item.docType || item.doc_type) return item.docType || item.doc_type;
  const category = item.category_id;
  if (!['reading_comprehension', 'listening_comprehension'].includes(category)) return null;

  const support = item.support || null;
  if (category === 'reading_comprehension') {
    if (support?.kind) {
      if (support.kind === 'courriel' || support.kind === 'article' || support.kind === 'sms') return support.kind;
      if (READING_DOC_TYPES.has(support.kind)) return support.kind;
    }

    const haystack = normalizeText([
      item.subcategory_id,
      ...(item.tags || []),
      item.context,
      item.prompt,
    ].join(' '));

    const checks = [
      ['sms', /\bsms\b|texto|message court|salut !|reponds-moi/],
      ['courriel', /courriel|e-mail|email|objet\s*:|de\s*:/],
      ['lettre', /lettre|madame, monsieur|cher monsieur|chere madame/],
      ['affiche', /affiche|mediatheque|fermeture exceptionnelle|forum|cours de yoga/],
      ['panneau', /panneau|gare|voie|ouverture|circulation interdite/],
      ['annonce', /annonce|colocation|atelier|disponible|contact/],
      ['menu', /menu|plat du jour|entree|dessert|restaurant/],
      ['horaire', /horaire|depart|arrivee|ouverture|fermeture/],
      ['document_administratif', /formulaire|prefecture|mairie|administratif|justificatif/],
      ['publicite', /publicite|promotion|offre speciale|reduction/],
      ['article', /article|extrait|presse|editorial|chronique|tribune/],
    ];

    return checks.find(([, pattern]) => pattern.test(haystack))?.[0] || null;
  }

  if (category === 'listening_comprehension') {
    if (support?.audio?.speakers?.length) return 'dialogue';
    const text = normalizeText(`${item.subcategory_id || ''} ${(item.tags || []).join(' ')} ${support?.audio?.transcript || ''} ${item.prompt || ''}`);
    if (/interview|intervenant|intervenante|conferencier|conferenciere/.test(text)) return 'interview';
    if (/mesdames et messieurs|annonce|train|quai|bus|gare|musee/.test(text)) return 'annonce_audio';
    if (/votre rendez-vous|votre colis|message|confirme/.test(text)) return 'message_vocal';
    if (/chronique|editorialiste|bulletin|selon/.test(text)) return 'bulletin';
    return LISTENING_DOC_TYPES.has(item.subcategory_id) ? item.subcategory_id : 'message_vocal';
  }

  return null;
}

const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seed de la base de données...\n');

    // 1. Insertion des catégories
    console.log('📂 Insertion des catégories...');
    const categories = [
      { name: 'Grammaire', slug: 'grammar', icon_color: '#3b82f6' },
      { name: 'Conjugaison', slug: 'conjugation', icon_color: '#8b5cf6' },
      { name: 'Vocabulaire', slug: 'vocabulary', icon_color: '#10b981' },
      { name: 'Compréhension Écrite', slug: 'reading_comprehension', icon_color: '#f59e0b' },
      { name: 'Compréhension Orale', slug: 'listening_comprehension', icon_color: '#0891b2' }
    ];

    const categoryMap = {};
    for (const cat of categories) {
      const result = await client.query(
        `INSERT INTO categories (name, slug, icon_color) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (slug) DO UPDATE SET name = $1, icon_color = $3
         RETURNING id, slug`,
        [cat.name, cat.slug, cat.icon_color]
      );
      categoryMap[cat.slug] = result.rows[0].id;
      console.log(`  ✓ ${cat.name} (ID: ${result.rows[0].id})`);
    }

    // 2. Chargement et insertion des exercices depuis items.json
    console.log('\n📝 Chargement des exercices depuis items.json...');
    const itemsPath = path.join(__dirname, '../data/items.json');
    const itemsData = await fs.readFile(itemsPath, 'utf-8');
    const items = JSON.parse(itemsData);

    if (!items.items || !Array.isArray(items.items)) {
      throw new Error('Format items.json invalide');
    }

    console.log(`📊 ${items.items.length} exercices trouvés`);

    let inserted = 0;
    let skipped = 0;

    for (const item of items.items) {
      try {
        const categoryId = categoryMap[item.category_id];
        
        if (!categoryId) {
          console.warn(`  ⚠ Catégorie inconnue: ${item.category_id} - Exercice ignoré`);
          skipped++;
          continue;
        }

        const distractors = buildDistractors(item);

        await client.query(
          `INSERT INTO exercises (
            id, exam, level, category_id, subcategory, type, 
            prompt, context, support, doc_type, choices, answer, explanation, distractors,
            tags, difficulty, language
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (id) DO UPDATE SET
            exam = EXCLUDED.exam,
            level = EXCLUDED.level,
            category_id = EXCLUDED.category_id,
            subcategory = EXCLUDED.subcategory,
            type = EXCLUDED.type,
            prompt = EXCLUDED.prompt,
            support = EXCLUDED.support,
            doc_type = EXCLUDED.doc_type,
            context = EXCLUDED.context,
            choices = EXCLUDED.choices,
            answer = EXCLUDED.answer,
            explanation = EXCLUDED.explanation,
            distractors = EXCLUDED.distractors,
            tags = EXCLUDED.tags,
            difficulty = EXCLUDED.difficulty,
            language = EXCLUDED.language`,
          [
            item.id,
            item.exam || 'TCF',
            item.level,
            categoryId,
            item.subcategory_id || null,
            item.type,
            item.prompt,
            item.context || null,
            item.support ? JSON.stringify(item.support) : null,
            deriveDocType(item),
            item.choices ? JSON.stringify(item.choices) : null,
            item.answer,
            item.explanation,
            distractors ? JSON.stringify(distractors) : null,
            item.tags || [],
            item.difficulty || 1,
            item.language || 'fr'
          ]
        );
        inserted++;
        
        if (inserted % 50 === 0) {
          console.log(`  ⏳ ${inserted} exercices insérés...`);
        }
      } catch (err) {
        console.error(`  ❌ Erreur insertion exercice ${item.id}:`, err.message);
        skipped++;
      }
    }

    console.log(`\n✅ Seed terminé !`);
    console.log(`  ✓ Exercices insérés: ${inserted}`);
    console.log(`  ⚠ Exercices ignorés: ${skipped}`);

    // 3. Statistiques finales
    const stats = await client.query(`
      SELECT 
        c.name as category,
        level,
        COUNT(*) as count
      FROM exercises e
      JOIN categories c ON e.category_id = c.id
      GROUP BY c.name, level
      ORDER BY c.name, level
    `);

    console.log('\n📊 Répartition des exercices:');
    console.table(stats.rows);

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export default seedDatabase;
