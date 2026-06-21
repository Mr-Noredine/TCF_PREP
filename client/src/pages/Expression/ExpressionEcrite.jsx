import { useState, useEffect, useRef, useCallback } from 'react';
import '../../styles/expression.css';

// ── Data ─────────────────────────────────────────────────────────────────────

const TASKS = [
  {
    id: 'T1',
    label: 'Tâche 1 — Formulaire',
    duration: 600,      // 10 min
    targetWords: [30, 40],
    subjects: [
      {
        text: 'Vous souhaitez vous inscrire à la bibliothèque municipale de votre ville. Remplissez le formulaire d\'inscription ci-dessous.',
        form: ['Prénom :', 'Nom :', 'Date de naissance :', 'Adresse :', 'Téléphone :', 'Courriel :', 'Motif d\'inscription :'],
      },
      {
        text: 'Vous désirez adhérer à un club de randonnée. Complétez la fiche de membre avec vos informations.',
        form: ['Nom complet :', 'Âge :', 'Niveau (débutant / intermédiaire / avancé) :', 'Disponibilités :', 'Problème de santé éventuel :', 'Signature :'],
      },
      {
        text: 'Vous participez à un programme d\'échange linguistique. Remplissez le formulaire de candidature.',
        form: ['Langue maternelle :', 'Langue cible :', 'Niveau actuel :', 'Disponibilités hebdomadaires :', 'Motivation (1 phrase) :'],
      },
    ],
  },
  {
    id: 'T2',
    label: 'Tâche 2 — Message',
    duration: 1200,     // 20 min
    targetWords: [60, 80],
    subjects: [
      {
        text: 'Vous avez commandé un téléphone en ligne mais il est arrivé endommagé. Écrivez un message au service client pour expliquer le problème et demander un remboursement ou un échange.',
        form: null,
      },
      {
        text: 'Vous organisez une fête d\'anniversaire surprise pour votre ami(e). Écrivez un message à vos amis communs pour les inviter et leur donner les détails pratiques.',
        form: null,
      },
      {
        text: 'Vous avez trouvé un portefeuille dans la rue. Écrivez un message à la mairie pour signaler votre trouvaille et demander la marche à suivre.',
        form: null,
      },
      {
        text: 'Votre voisin fait du bruit la nuit et vous empêche de dormir. Écrivez-lui un message poli pour lui expliquer la situation et trouver une solution.',
        form: null,
      },
    ],
  },
  {
    id: 'T3',
    label: 'Tâche 3 — Opinion',
    duration: 1800,     // 30 min
    targetWords: [120, 150],
    subjects: [
      {
        text: 'Des transports en commun entièrement gratuits amélioreraient-ils la qualité de vie en ville ? Donnez votre opinion en vous appuyant sur des exemples.',
        form: null,
      },
      {
        text: 'Faut-il interdire les téléphones portables dans les écoles ? Présentez votre point de vue et des arguments pour le défendre.',
        form: null,
      },
      {
        text: 'Pensez-vous que le télétravail est bénéfique pour les salariés et les entreprises ? Développez votre réponse.',
        form: null,
      },
      {
        text: 'Les réseaux sociaux ont-ils plus d\'effets positifs que négatifs sur les relations humaines ? Exprimez votre opinion avec des arguments.',
        form: null,
      },
    ],
  },
];

const CECRL_GRID = [
  {
    criterion: 'Adéquation à la tâche',
    levels: {
      A1: 'Reproduit des mots isolés.',
      A2: 'Répond à la consigne de façon très simple.',
      B1: 'Traite tous les points de la consigne.',
      B2: 'Traite tous les points avec nuance.',
      C1: 'Répond avec précision et pertinence.',
      C2: 'Réponse complète, sophistiquée.',
    },
  },
  {
    criterion: 'Cohérence & cohésion',
    levels: {
      A1: 'Juxtaposition de mots.',
      A2: 'Connecteurs simples (et, mais, alors).',
      B1: 'Enchaînements logiques basiques.',
      B2: 'Bonne organisation, transitions.',
      C1: 'Cohésion très bien maîtrisée.',
      C2: 'Structure élaborée et maîtrisée.',
    },
  },
  {
    criterion: 'Morphosyntaxe',
    levels: {
      A1: 'Structures très simples, nombreuses erreurs.',
      A2: 'Phrases simples, quelques erreurs basiques.',
      B1: 'Contrôle de structures de base.',
      B2: 'Bonne maîtrise, erreurs rares.',
      C1: 'Maîtrise de structures complexes.',
      C2: 'Maîtrise quasi parfaite.',
    },
  },
  {
    criterion: 'Lexique',
    levels: {
      A1: 'Vocabulaire très limité.',
      A2: 'Vocabulaire de base suffisant.',
      B1: 'Vocabulaire varié sur sujets familiers.',
      B2: 'Large gamme de vocabulaire.',
      C1: 'Précis, nuancé, idiomatique.',
      C2: 'Maîtrise totale, register adapté.',
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(s) {
  if (s <= 0) s = 0;
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function countWords(text) {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

const DRAFT_KEY = (taskId, subjectIdx) => `xp-ee-draft-${taskId}-${subjectIdx}`;

// ── Component ─────────────────────────────────────────────────────────────────

const IcoClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcoSave = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const IcoChevron = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    style={{ transform: open ? 'rotate(90deg)' : 'none', transition: '200ms' }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const ExpressionEcrite = () => {
  const [taskIdx,      setTaskIdx]      = useState(0);
  const [subjectIdx,   setSubjectIdx]   = useState(0);
  const [text,         setText]         = useState('');
  const [timeLeft,     setTimeLeft]     = useState(null);
  const [running,      setRunning]      = useState(false);
  const [gridOpen,     setGridOpen]     = useState(false);
  const [savedAt,      setSavedAt]      = useState(null);
  const intervalRef = useRef(null);

  const task    = TASKS[taskIdx];
  const subject = task.subjects[subjectIdx];
  const words   = countWords(text);
  const [minW, maxW] = task.targetWords;

  // Load draft when task/subject changes
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY(task.id, subjectIdx));
    setText(saved || '');
    setTimeLeft(task.duration);
    setRunning(false);
    setSavedAt(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [taskIdx, subjectIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown
  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { setRunning(false); clearInterval(intervalRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // Auto-save every 30 s
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      localStorage.setItem(DRAFT_KEY(task.id, subjectIdx), text);
      setSavedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(id);
  }, [running, text, task.id, subjectIdx]);

  const saveDraft = useCallback(() => {
    localStorage.setItem(DRAFT_KEY(task.id, subjectIdx), text);
    setSavedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  }, [task.id, subjectIdx, text]);

  const tc = timeLeft !== null && timeLeft <= 60 ? 'xp-timer--danger'
    : timeLeft !== null && timeLeft <= 180 ? 'xp-timer--warning' : '';

  const wordClass = words > maxW ? 'xp-word-count--over'
    : words >= minW ? 'xp-word-count--target' : '';

  return (
    <main>
      <div className="xp-page">
        {/* Hero */}
        <div className="xp-hero">
          <p className="xp-hero__kicker">TCF — Production</p>
          <h1 className="xp-hero__h1">Expression écrite</h1>
          <p className="xp-hero__sub">
            Choisissez une tâche, lisez le sujet, lancez le minuteur et rédigez. Le brouillon est sauvegardé localement.
          </p>
        </div>

        {/* Task tabs */}
        <div className="xp-tasks" role="tablist" aria-label="Choisir une tâche">
          {TASKS.map((t, i) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={i === taskIdx}
              className={`xp-task-btn${i === taskIdx ? ' xp-task-btn--on' : ''}`}
              onClick={() => { setTaskIdx(i); setSubjectIdx(0); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Subject selector */}
        {task.subjects.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {task.subjects.map((_, i) => (
              <button
                key={i}
                className={`xp-task-btn${i === subjectIdx ? ' xp-task-btn--on' : ''}`}
                style={{ fontSize: '.78rem', padding: '5px 10px' }}
                onClick={() => setSubjectIdx(i)}
              >
                Sujet {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Subject card */}
        <div className="xp-subject-card">
          <p className="xp-subject-card__label">Sujet</p>
          <p className="xp-subject-card__text">{subject.text}</p>
          {subject.form && (
            <ul style={{ marginTop: '12px', paddingLeft: '16px', fontSize: '.875rem', color: 'var(--tx-2)', lineHeight: '1.8' }}>
              {subject.form.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
          )}
          <p className="xp-subject-card__meta">
            Durée : {task.duration / 60} min · Longueur cible : {minW}–{maxW} mots
          </p>
        </div>

        {/* Timer */}
        <div className="xp-timer-strip">
          <div className={`xp-timer ${tc}`}>
            <IcoClock />
            {timeLeft !== null ? fmtTime(timeLeft) : fmtTime(task.duration)}
          </div>
          <div className="xp-timer-btns">
            {!running ? (
              <button className="xp-timer-btn xp-timer-btn--primary" onClick={() => setRunning(true)}>
                {timeLeft === task.duration ? 'Démarrer' : 'Reprendre'}
              </button>
            ) : (
              <button className="xp-timer-btn" onClick={() => setRunning(false)}>Pause</button>
            )}
            <button className="xp-timer-btn" onClick={() => { setTimeLeft(task.duration); setRunning(false); }}>
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="xp-editor-wrap">
          <textarea
            className="xp-editor"
            placeholder="Rédigez votre texte ici…"
            value={text}
            onChange={e => setText(e.target.value)}
            aria-label="Zone de rédaction"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <span className="xp-draft-notice">
              {savedAt ? <><IcoSave /> Brouillon sauvegardé à {savedAt}</> : null}
            </span>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                className="xp-timer-btn"
                style={{ fontSize: '.75rem', padding: '4px 10px' }}
                onClick={saveDraft}
              >
                <IcoSave /> Sauvegarder
              </button>
              <p className={`xp-word-count ${wordClass}`}>
                {words} mot{words > 1 ? 's' : ''} {words >= minW && words <= maxW ? '✓' : `(cible : ${minW}–${maxW})`}
              </p>
            </div>
          </div>
        </div>

        {/* CECRL Grid */}
        <div>
          <button className="xp-grid-toggle" onClick={() => setGridOpen(o => !o)} aria-expanded={gridOpen}>
            <IcoChevron open={gridOpen} />
            Grille d'évaluation CECRL (auto-évaluation)
          </button>
          {gridOpen && (
            <div className="xp-grid" style={{ marginTop: '10px' }}>
              <div className="xp-grid__head">
                <span>Critère</span>
                {['A1','A2','B1','B2','C1','C2'].map(l => <span key={l}>{l}</span>)}
              </div>
              {CECRL_GRID.map((row, i) => (
                <div key={i} className="xp-grid__row">
                  <span className="xp-grid__criterion">{row.criterion}</span>
                  {['A1','A2','B1','B2','C1','C2'].map(l => (
                    <span key={l} className="xp-grid__cell">{row.levels[l]}</span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="xp-disclaimer">
          <strong>Auto-évaluation uniquement.</strong> Ce simulateur ne remplace pas la correction d'un examinateur certifié TCF. Le brouillon est stocké uniquement dans votre navigateur et n'est jamais envoyé à un serveur.
        </div>
      </div>
    </main>
  );
};

export default ExpressionEcrite;
