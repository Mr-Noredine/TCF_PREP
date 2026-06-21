import './AnswerExplanation.css';

function parseDistractors(value) {
  if (!value) return [];
  let parsed = value;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value); } catch (_) { return []; }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
  return Object.entries(parsed).filter(([, reason]) => Boolean(reason));
}

const AnswerExplanation = ({ explanation, distractors, compact = false }) => {
  const entries = parseDistractors(distractors);
  if (!explanation && entries.length === 0) return null;

  return (
    <div className={`answer-explanation${compact ? ' answer-explanation--compact' : ''}`}>
      {explanation && (
        <p className="answer-explanation__rule">
          <strong>Règle :</strong> {explanation}
        </p>
      )}
      {entries.length > 0 && (
        <div className="answer-explanation__distractors">
          <span className="answer-explanation__label">Pourquoi les autres réponses sont fausses</span>
          <ul>
            {entries.map(([choice, reason]) => (
              <li key={choice}>
                <strong>{choice}</strong> : {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AnswerExplanation;
