import { Link } from 'react-router-dom';

const IcoArrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const EmptyIco = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const NEXT_LEVEL = { A1: 'A2', A2: 'B1', B1: 'B2', B2: 'C1', C1: 'C2' };

const Recommendations = ({ recommendations }) => {
  if (!recommendations) return null;

  const { weakAreas, strongAreas, nextLevel, notStartedAreas } = recommendations;
  const recs = [];

  weakAreas?.forEach(a => recs.push({
    type: 'improve',
    label: 'À améliorer',
    title: `Améliorez ${a.name}`,
    text: `Score moyen : ${Math.round(a.average_score)}%${a.level ? ` — point faible au niveau ${a.level}` : ''}. Continuez à pratiquer !`,
    action: 'Pratiquer', link: `/exercices?category=${a.slug}`,
  }));

  strongAreas?.forEach(a => recs.push({
    type: 'continue',
    label: 'Point fort',
    title: `Excellent en ${a.name} !`,
    text: `Vous maîtrisez cette catégorie avec ${Math.round(a.average_score)}% de score moyen.`,
    action: 'Continuer', link: `/exercices?category=${a.slug}`,
  }));

  nextLevel?.forEach(a => {
    const next = NEXT_LEVEL[a.level];
    if (!next) return;
    recs.push({
      type: 'level-up',
      label: 'Niveau suivant',
      title: `Passez au ${next} en ${a.name}`,
      text: `${Math.round(a.average_score)}% de score moyen — prêt pour le niveau supérieur ?`,
      action: 'Commencer', link: `/exercices?category=${a.slug}`,
    });
  });

  notStartedAreas?.forEach(a => recs.push({
    type: 'discover',
    label: 'À découvrir',
    title: `Découvrez ${a.name}`,
    text: `${a.total_exercises} exercices disponibles. Commencez cette compétence quand vous voulez.`,
    action: 'Découvrir', link: `/exercices?category=${a.slug}`,
  }));

  if (recs.length === 0) {
    return (
      <div className="ds-empty">
        <span className="ds-empty__ico"><EmptyIco /></span>
        <p className="ds-empty__title">Pas encore de recommandations</p>
        <p className="ds-empty__text">Complétez davantage d'exercices pour obtenir des suggestions personnalisées.</p>
      </div>
    );
  }

  return (
    <div className="ds-recs">
      {recs.slice(0, 4).map((r, i) => (
        <div key={i} className="ds-rec-item">
          <span className={`ds-rec-badge ds-rec-badge--${r.type}`}>{r.label}</span>
          <p className="ds-rec-title">{r.title}</p>
          <p className="ds-rec-text">{r.text}</p>
          <Link to={r.link} className="ds-rec-link">
            {r.action} <IcoArrow />
          </Link>
        </div>
      ))}
    </div>
  );
};

export default Recommendations;
