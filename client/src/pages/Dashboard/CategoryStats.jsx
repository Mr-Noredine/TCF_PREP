import { useNavigate } from 'react-router-dom';

const IcoFileText = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IcoBook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const IcoEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
);
const IcoLibrary = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const EmptyIco = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const CAT_META = {
  reading_comprehension: { color: '#4338CA', bg: '#EEF0FB', icon: IcoFileText },
  grammar:               { color: '#5B54C9', bg: '#F0EFFA', icon: IcoBook     },
  conjugation:           { color: '#4F6BD6', bg: '#EEF2FC', icon: IcoEdit     },
  vocabulary:            { color: '#6366A8', bg: '#F0F1F7', icon: IcoLibrary  },
  listening_comprehension: { color: '#0891B2', bg: '#ECFEFF', icon: IcoLibrary  },
};

const CategoryStats = ({ progress }) => {
  const navigate = useNavigate();

  if (!progress || progress.length === 0) {
    return (
      <div className="ds-empty">
        <span className="ds-empty__ico"><EmptyIco /></span>
        <p className="ds-empty__title">Commencez à pratiquer</p>
        <p className="ds-empty__text">
          Vos statistiques par catégorie apparaîtront ici après vos premiers exercices.
        </p>
        <div className="ds-empty__cta">
          <a href="/exercices" className="btn-primary" style={{ fontSize: '.8rem', padding: '8px 18px' }}>
            Commencer un exercice
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-cat-grid">
      {progress.map((cat, i) => {
        const m         = CAT_META[cat.category_slug] || { color: '#4F46E5', bg: '#EEF2FF', icon: IcoBook };
        const Icon      = m.icon;
        const completed = Math.min(Number(cat.completed_exercises || 0), Number(cat.total_exercises || 0));
        const total     = Number(cat.total_exercises || 0);
        const pct       = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
        const hasAttempts = completed > 0;
        const score     = hasAttempts ? Math.round(cat.average_score || 0) : null;

        return (
          <div
            key={cat.category_slug || i}
            className="ds-cat-card"
            onClick={() => navigate(`/exercices?category=${cat.category_slug}`)}
            tabIndex="0"
            onKeyDown={e => e.key === 'Enter' && navigate(`/exercices?category=${cat.category_slug}`)}
            aria-label={hasAttempts ? `${cat.category_name} — score moyen ${score}%` : `${cat.category_name} — à découvrir`}
          >
            <div className="ds-cat-card__head">
              <div className="ds-cat-ico" style={{ background: m.bg, color: m.color }}>
                <Icon />
              </div>
              <div>
                <p className="ds-cat-name">{cat.category_name}</p>
                <p className="ds-cat-lvl">{completed} exercices tentés</p>
              </div>
            </div>

            <div className="ds-cat-score-row">
              <span className={hasAttempts ? 'ds-cat-score' : 'ds-cat-score ds-cat-score--empty'}>
                {hasAttempts ? `${score}%` : 'À découvrir'}
              </span>
              <span className="ds-cat-count">{completed}/{total} exercices</span>
            </div>

            <div className="ds-cat-bar">
              <div
                className="ds-cat-bar__fill"
                style={{ width: `${pct}%`, background: m.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CategoryStats;
