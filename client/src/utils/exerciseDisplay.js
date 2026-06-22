const LEVEL_SUFFIX = /\s*(?:\(([A-C][12]-\d+)\)|\b[A-C][12]-\d+\b)\s*/g;
const TECHNICAL_EXERCISE_TITLE = /^exercice\s+[a-z0-9_-]*\d[a-z0-9_-]*$/i;

export function cleanExercisePrompt(prompt) {
  const value = String(prompt || '').trim();
  if (TECHNICAL_EXERCISE_TITLE.test(value)) return 'Exercice';

  return value
    .replace(/\s*:\s*$/g, '')
    .replace(LEVEL_SUFFIX, match => {
      const trimmed = match.trim();
      if (trimmed.startsWith('(')) return '';
      return ' ';
    })
    .replace(/\s+([.,])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/phrase\s*:/i, 'phrase :')
    .replace(/document\s*\?/i, 'document ?')
    .trim();
}
