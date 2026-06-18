import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/home.css';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IcoFileText = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IcoBook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const IcoEdit = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
);
const IcoLibrary = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IcoLayers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IcoChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IcoZap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

// ─── Category data ────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    slug: 'reading_comprehension',
    name: 'Compréhension écrite',
    color: '#4338CA', bg: '#EEF0FB',
    icon: IcoFileText,
    desc: 'Comprenez des textes variés et répondez à des questions ciblées.',
    level: 'A1–C2',
  },
  {
    slug: 'grammar',
    name: 'Grammaire',
    color: '#5B54C9', bg: '#F0EFFA',
    icon: IcoBook,
    desc: 'Maîtrisez les règles grammaticales essentielles du français.',
    level: 'A1–C2',
  },
  {
    slug: 'conjugation',
    name: 'Conjugaison',
    color: '#4F6BD6', bg: '#EEF2FC',
    icon: IcoEdit,
    desc: 'Pratiquez les temps verbaux et les modes de conjugaison.',
    level: 'A1–C2',
  },
  {
    slug: 'vocabulary',
    name: 'Vocabulaire',
    color: '#6366A8', bg: '#F0F1F7',
    icon: IcoLibrary,
    desc: 'Enrichissez votre vocabulaire avec des exercices thématiques.',
    level: 'A1–C2',
  },
];

const FEATURES = [
  {
    color: '#4338CA', bg: '#EEF0FB', icon: IcoLayers,
    title: 'Exercices structurés',
    desc: 'Contenus organisés par catégorie et niveau pour une progression optimale du A1 au C2.',
  },
  {
    color: '#5B54C9', bg: '#F0EFFA', icon: IcoChart,
    title: 'Suivi en temps réel',
    desc: 'Statistiques détaillées et recommandations personnalisées basées sur vos résultats.',
  },
  {
    color: '#4F6BD6', bg: '#EEF2FC', icon: IcoCheck,
    title: 'Feedback instantané',
    desc: 'Comprenez chaque erreur immédiatement avec une explication claire après chaque réponse.',
  },
  {
    color: '#15966B', bg: '#EDFBF5', icon: IcoZap,
    title: 'Contenu adaptatif',
    desc: 'Des exercices qui vous accompagnent vers le niveau suivant selon vos performances.',
  },
];

// ─── Home ─────────────────────────────────────────────────────────────────────

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <>
      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section className="home-hero" aria-label="Présentation">
        <div className="home-hero__inner">
          {/* Text */}
          <div>
            <p className="home-hero__badge animate-fade-up">
              <span className="home-hero__badge-dot" aria-hidden="true" />
              Préparation officielle TCF · Niveaux A1 à C2
            </p>

            <h1 className="home-hero__h1 animate-fade-up-1">
              {isAuthenticated ? (
                <>Bon retour,<br /><em>{user?.firstname}</em></>
              ) : (
                <>Préparez votre<br /><em>TCF</em> avec méthode</>
              )}
            </h1>

            <p className="home-hero__sub animate-fade-up-2">
              {isAuthenticated
                ? 'Continuez votre parcours. Chaque exercice vous rapproche de votre objectif de certification.'
                : "Des exercices ciblés du niveau A1 au C2, un suivi précis de vos progrès et des recommandations personnalisées."}
            </p>

            <div className="home-hero__cta animate-fade-up-3">
              {isAuthenticated ? (
                <>
                  <Link to="/exercices" className="btn-primary">
                    Commencer un exercice <IcoArrow />
                  </Link>
                  <Link to="/dashboard" className="btn-secondary">
                    Mon tableau de bord
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth?mode=register" className="btn-primary">
                    S'inscrire <IcoArrow />
                  </Link>
                  <Link to="/auth?mode=login" className="btn-secondary">
                    Se connecter
                  </Link>
                </>
              )}
            </div>

            <div className="home-hero__stats animate-fade-up-4">
              <div className="home-stat">
                <span className="home-stat__num">240</span>
                <span className="home-stat__lbl">Questions</span>
              </div>
              <div className="home-stat">
                <span className="home-stat__num">4</span>
                <span className="home-stat__lbl">Catégories</span>
              </div>
              <div className="home-stat">
                <span className="home-stat__num">A1–C2</span>
                <span className="home-stat__lbl">Niveaux CECRL</span>
              </div>
              <div className="home-stat">
                <span className="home-stat__num">100%</span>
                <span className="home-stat__lbl">Gratuit</span>
              </div>
            </div>
          </div>

          {/* Visual — mini category cards */}
          <div className="home-hero__visual" aria-hidden="true">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.slug}
                  className="hv-card"
                  style={{ '--cc': cat.color, '--cb': cat.bg }}
                >
                  <div className="hv-card__top">
                    <div className="hv-card__ico" style={{ background: cat.bg, color: cat.color }}>
                      <Icon />
                    </div>
                    <span className="hv-card__lvl">A1</span>
                  </div>
                  <span className="hv-card__name">{cat.name}</span>
                  <div className="hv-card__bar">
                    <div
                      className="hv-card__bar-fill"
                      style={{ width: `${40 + Math.random() * 40 | 0}%`, background: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ CONTINUE STRIP (if logged in) ══════════════════════════════════ */}
      {isAuthenticated && (
        <div className="home-continue">
          <div className="home-continue__inner">
            <div className="home-continue__text">
              <div className="home-continue__ico">
                <IcoZap />
              </div>
              <div>
                <p className="home-continue__title">Reprendre l'entraînement</p>
                <p className="home-continue__sub">Continuez là où vous vous êtes arrêté</p>
              </div>
            </div>
            <Link to="/exercices" className="btn-primary">
              Voir les exercices <IcoArrow />
            </Link>
          </div>
        </div>
      )}

      {/* ══ CATEGORIES ══════════════════════════════════════════════════════ */}
      <section className="home-cats">
        <div className="home-cats__inner">
          <div className="home-section-head">
            <span className="home-section-kicker">Bibliothèque</span>
            <h2>Toutes les catégories</h2>
            <p>Choisissez votre domaine et progressez à votre rythme, niveau par niveau.</p>
          </div>

          <div className="home-cats__grid">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  to="/exercices"
                  className="home-cat-card"
                  style={{ '--cc': cat.color, '--cb': cat.bg }}
                  aria-label={`Exercices : ${cat.name}`}
                >
                  <div className="home-cat-card__ico">
                    <Icon />
                  </div>
                  <span className="home-cat-card__name">{cat.name}</span>
                  <h3 className="home-cat-card__title">{cat.name}</h3>
                  <p className="home-cat-card__desc">{cat.desc}</p>
                  <div className="home-cat-card__footer">
                    <span>Niveaux {cat.level}</span>
                    <span className="home-cat-card__arrow"><IcoArrow /></span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ WHY ════════════════════════════════════════════════════════════ */}
      <section className="home-why">
        <div className="home-why__inner">
          <div className="home-section-head">
            <span className="home-section-kicker">Nos points forts</span>
            <h2>Pourquoi choisir TCF Prep ?</h2>
            <p>Tout ce dont vous avez besoin pour réussir votre certification TCF. Rien de superflu.</p>
          </div>

          <div className="home-why__grid">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="home-feat">
                  <div className="home-feat__ico" style={{ background: f.bg, color: f.color }}>
                    <Icon />
                  </div>
                  <h3 className="home-feat__title">{f.title}</h3>
                  <p className="home-feat__desc">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ CTA ════════════════════════════════════════════════════════════ */}
      <section className="home-cta" aria-label="Appel à l'action">
        <div className="home-cta__inner">
          <div>
            <h2>
              {isAuthenticated
                ? 'Continuez votre progression'
                : 'Prêt à commencer ?'}
            </h2>
            <p>
              {isAuthenticated
                ? 'Accédez à vos statistiques, suivez vos progrès et obtenez des recommandations personnalisées.'
                : "240 questions, 4 catégories, du A1 au C2. Inscription gratuite, accès complet, sans limite."}
            </p>
          </div>
          <div className="home-cta__actions">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn-cta-white">Voir mes progrès <IcoArrow /></Link>
                <Link to="/exercices" className="btn-secondary-dark">Exercices</Link>
              </>
            ) : (
              <>
                <Link to="/auth?mode=register" className="btn-cta-white">S'inscrire <IcoArrow /></Link>
                <Link to="/auth?mode=login" className="btn-secondary-dark">Se connecter</Link>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
