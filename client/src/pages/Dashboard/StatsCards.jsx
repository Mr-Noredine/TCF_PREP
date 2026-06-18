const IcoBook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const IcoTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);
const IcoClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcoTrophy = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="8 21 12 17 16 21"/>
    <line x1="12" y1="17" x2="12" y2="11"/>
    <path d="M7 4H2v5a5 5 0 0 0 5 5h0M17 4h5v5a5 5 0 0 1-5 5h0"/>
    <path d="M7 4h10v5a5 5 0 0 1-5 5h0a5 5 0 0 1-5-5V4z"/>
  </svg>
);
const IcoArrowUp   = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);
const IcoArrowDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

function formatTime(seconds) {
  if (!seconds) return '0 min';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

const StatsCards = ({ stats, exerciseSummary }) => {
  if (!stats) return null;
  const { overall } = stats;

  const avgScore  = Math.round(exerciseSummary?.averageScore ?? overall?.average_score ?? 0);
  const total     = exerciseSummary?.attempted ?? overall?.total_exercises_completed ?? 0;
  const succeeded = exerciseSummary?.done ?? overall?.successful_count ?? 0;
  const time      = formatTime(overall?.total_time_spent || 0);

  const cards = [
    {
      icon: IcoBook,
      num: total,
      lbl: 'Exercices complétés',
      color: '#4338CA',
      bg:    '#EEF0FB',
      trend: total > 0 ? 'up' : 'neu',
      trendLbl: total > 0 ? 'En progression' : 'Démarrez !',
    },
    {
      icon: IcoTarget,
      num: `${avgScore}%`,
      lbl: 'Score moyen',
      color: avgScore >= 70 ? '#15966B' : avgScore >= 50 ? '#D97706' : '#DC2626',
      bg:    avgScore >= 70 ? '#EDFBF5' : avgScore >= 50 ? '#FEF8EC' : '#FEF2F2',
      trend: avgScore >= 70 ? 'up' : avgScore >= 50 ? 'neu' : 'down',
      trendLbl: avgScore >= 70 ? 'Excellent' : avgScore >= 50 ? 'Correct' : 'À améliorer',
    },
    {
      icon: IcoClock,
      num: time,
      lbl: 'Temps d\'entraînement',
      color: '#4F6BD6',
      bg:    '#EEF2FC',
      trend: 'neu',
      trendLbl: 'Total cumulé',
    },
    {
      icon: IcoTrophy,
      num: succeeded,
      lbl: 'Exercices réussis (≥70%)',
      color: '#5B54C9',
      bg:    '#F0EFFA',
      trend: succeeded > 0 ? 'up' : 'neu',
      trendLbl: succeeded > 0 ? 'Bravo !' : 'Continuez',
    },
  ];

  return (
    <div className="ds-stats">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="ds-stat-card"
            style={{ '--sc': c.color, '--sb': c.bg }}
          >
            <div className="ds-stat-ico">
              <Icon />
            </div>
            <div className="ds-stat-body">
              <span className="ds-stat-num">{c.num}</span>
              <span className="ds-stat-lbl">{c.lbl}</span>
              <div className={`ds-stat-trend ds-stat-trend--${c.trend}`}>
                {c.trend === 'up'   && <IcoArrowUp />}
                {c.trend === 'down' && <IcoArrowDown />}
                {c.trendLbl}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
