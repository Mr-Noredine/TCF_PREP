import { Link } from 'react-router-dom';

const IcoFileText = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const IcoClipboard = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
);

const EmptyIco = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
  </svg>
);

function scoreClass(pct) {
  if (pct >= 80) return 'ds-sc-excellent';
  if (pct >= 70) return 'ds-sc-good';
  if (pct >= 50) return 'ds-sc-average';
  return 'ds-sc-poor';
}

function scoreLabel(pct) {
  if (pct >= 80) return 'Excellent';
  if (pct >= 70) return 'Bien';
  if (pct >= 50) return 'Moyen';
  return 'À revoir';
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatTime(s) {
  if (!s) return '0s';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}min ${sec}s` : `${sec}s`;
}

const LEVEL_COLORS = {
  A1: '#4338CA', A2: '#4338CA',
  B1: '#4F6BD6', B2: '#4F6BD6',
  C1: '#15966B', C2: '#15966B',
};

const QuizHistory = ({ attempts, examHistory }) => {
  const hasAttempts = attempts && attempts.length > 0;
  const hasExams    = examHistory && examHistory.length > 0;

  if (!hasAttempts && !hasExams) {
    return (
      <div className="ds-empty">
        <span className="ds-empty__ico"><EmptyIco /></span>
        <p className="ds-empty__title">Aucun historique</p>
        <p className="ds-empty__text">Complétez des exercices ou un examen blanc pour voir votre historique ici.</p>
      </div>
    );
  }

  return (
    <div className="ds-history">
      {/* Exam sessions — shown first */}
      {hasExams && examHistory.map((ex, i) => {
        const pct   = Math.round(ex.percentage || 0);
        const level = ex.level_estimate;
        const color = level && LEVEL_COLORS[level] ? LEVEL_COLORS[level] : '#4338CA';
        return (
          <Link
            key={`exam-${i}`}
            to={`/examen/resultats/${ex.id}`}
            className="ds-history-item"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="ds-history-ico" style={{ color }}>
              <IcoClipboard />
            </div>
            <div className="ds-history-info">
              <p className="ds-history-title">
                Examen blanc
                {level && (
                  <span style={{
                    marginLeft: '8px', fontSize: '0.72rem', fontWeight: 700,
                    padding: '1px 6px', borderRadius: '4px',
                    background: color + '1A', color,
                  }}>
                    {level}
                  </span>
                )}
                {' '}— {ex.format === 'complet' ? '40 questions' : '15 questions'}
              </p>
              <p className="ds-history-meta">
                {formatDate(ex.completed_at || ex.started_at)} &bull; {ex.score}/{ex.total_questions} pts &bull; {formatTime(ex.duration_seconds)}
              </p>
            </div>
            <div className="ds-history-score">
              <p className="ds-history-pct">{pct}%</p>
              <span className={`ds-history-lbl ${scoreClass(pct)}`}>{scoreLabel(pct)}</span>
            </div>
          </Link>
        );
      })}

      {/* Regular exercise attempts */}
      {hasAttempts && attempts.map((a, i) => {
        const pct = Math.round(a.percentage || 0);
        return (
          <div key={`attempt-${i}`} className="ds-history-item">
            <div className="ds-history-ico"><IcoFileText /></div>
            <div className="ds-history-info">
              <p className="ds-history-title">
                {a.category_name || 'Exercice'} — Niveau {a.level || '?'}
              </p>
              <p className="ds-history-meta">
                {formatDate(a.completed_at)} &bull; {a.score}/{a.max_score} pts &bull; {formatTime(a.time_spent)}
              </p>
            </div>
            <div className="ds-history-score">
              <p className="ds-history-pct">{pct}%</p>
              <span className={`ds-history-lbl ${scoreClass(pct)}`}>{scoreLabel(pct)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuizHistory;
