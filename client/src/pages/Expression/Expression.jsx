import { Link } from 'react-router-dom';
import '../../styles/expression.css';

const IcoPen = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const IcoMic = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const CARDS = [
  {
    to: '/expression-ecrite',
    title: 'Expression écrite',
    tag: 'EE · 3 tâches',
    desc: 'Remplir un formulaire, rédiger un message, exprimer son point de vue. Minuteur officiel, compteur de mots, grille d\'évaluation CECRL.',
    color: '#4338CA', bg: '#EEF0FB',
    Icon: IcoPen,
  },
  {
    to: '/expression-orale',
    title: 'Expression orale',
    tag: 'EO · 3 tâches',
    desc: 'Monologue suivi, interaction, expression d\'un point de vue. Minuteur de préparation + réponse, enregistrement local, grille CECRL.',
    color: '#15966B', bg: '#EDFBF5',
    Icon: IcoMic,
  },
];

const Expression = () => (
  <main>
    <div className="xp-page">
      <div className="xp-hero">
        <p className="xp-hero__kicker">Production en français</p>
        <h1 className="xp-hero__h1">Expression écrite &amp; orale</h1>
        <p className="xp-hero__sub">
          Préparez les épreuves de production du TCF dans les conditions réelles :
          sujets types, minuteur officiel et grille d'évaluation CECRL pour vous auto-évaluer.
        </p>
      </div>

      <div className="xp-hub-grid">
        {CARDS.map(c => {
          const Icon = c.Icon;
          return (
            <Link key={c.to} to={c.to} className="xp-hub-card" style={{ '--cc': c.color }}>
              <div className="xp-hub-card__ico" style={{ background: c.bg, color: c.color }}>
                <Icon />
              </div>
              <p className="xp-hub-card__title" style={{ color: c.color }}>{c.title}</p>
              <p className="xp-hub-card__desc">{c.desc}</p>
              <span className="xp-hub-card__tag">{c.tag}</span>
              <span style={{ marginTop: '8px', fontSize: '.8rem', color: c.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                Accéder <IcoArrow />
              </span>
            </Link>
          );
        })}
      </div>

      <div className="xp-disclaimer">
        <strong>Rappel :</strong> Ces exercices sont des simulations d'auto-évaluation. Ils ne remplacent pas une correction par un examinateur certifié TCF. Aucune production n'est envoyée à un serveur.
      </div>
    </div>
  </main>
);

export default Expression;
