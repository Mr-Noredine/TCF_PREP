import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examenService } from '../../services/examenService';
import '../../styles/examen.css';

const IcoClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcoLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IcoEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IcoAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const FORMATS = {
  express: {
    label: 'Examen express',
    time:  '15 minutes',
    questions: '15 questions',
    desc: 'Un aperçu rapide de votre niveau. Idéal pour un entraînement régulier.',
  },
  complet: {
    label: 'Examen complet',
    time:  '40 minutes',
    questions: '40 questions',
    desc: 'Simulation complète du TCF. Estimation de niveau plus fiable.',
  },
};

const RULES = [
  { ico: IcoClock, text: <><strong>Chronométré.</strong> Le minuteur démarre dès le début et ne peut pas être mis en pause.</> },
  { ico: IcoLock,  text: <><strong>Sans retour.</strong> Une réponse validée est verrouillée définitivement.</> },
  { ico: IcoEye,   text: <><strong>Pas de feedback.</strong> Les corrections n'apparaissent qu'à la fin.</> },
  { ico: IcoAlert, text: <><strong>Résultat indicatif.</strong> Le niveau estimé ne remplace pas un test TCF officiel.</> },
];

const Examen = () => {
  const [format, setFormat] = useState('express');
  const [loading, setLoading] = useState(false);
  const [error, setError]  = useState('');
  const navigate = useNavigate();

  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await examenService.createSession(format);
      navigate(`/examen/session/${data.session.id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de créer l\'examen. Réessayez.');
      setLoading(false);
    }
  };

  return (
    <main>
      <div className="exb-config">
        <div className="exb-hero">
          <p className="exb-hero__kicker">Simulation TCF</p>
          <h1 className="exb-hero__h1">Examen blanc</h1>
          <p className="exb-hero__sub">
            Testez-vous dans les conditions réelles du TCF : chronométré, sans feedback immédiat,
            résultat avec niveau CECRL estimé.
          </p>
        </div>

        {/* Rules */}
        <div className="exb-rules">
          {RULES.map((r, i) => {
            const Icon = r.ico;
            return (
              <div key={i} className="exb-rule">
                <span className="exb-rule__ico"><Icon /></span>
                <span>{r.text}</span>
              </div>
            );
          })}
        </div>

        {/* Format selector */}
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--tx-3)', marginBottom: '12px' }}>
          Choisir le format
        </h2>
        <div className="exb-formats">
          {Object.entries(FORMATS).map(([key, f]) => (
            <button
              key={key}
              className={`exb-format${format === key ? ' exb-format--selected' : ''}`}
              onClick={() => setFormat(key)}
              type="button"
            >
              <div className="exb-format__title">{f.label}</div>
              <div className="exb-format__meta">{f.questions} · {f.time}</div>
              <div className="exb-format__desc">{f.desc}</div>
            </button>
          ))}
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#991B1B', fontSize: '0.875rem', marginBottom: '12px' }}>
            {error}
          </div>
        )}

        <div className="exb-start-area">
          <button
            className="btn-primary"
            style={{ fontSize: '1rem', padding: '14px 36px', minHeight: '52px' }}
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? 'Création de l\'examen…' : <>Commencer l'examen <IcoArrow /></>}
          </button>

          <div className="exb-warning">
            <IcoAlert />
            Le minuteur démarre immédiatement et ne peut pas être mis en pause.
          </div>
        </div>
      </div>
    </main>
  );
};

export default Examen;
