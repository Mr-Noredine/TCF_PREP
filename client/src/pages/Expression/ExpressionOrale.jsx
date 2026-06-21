import { useState, useEffect, useRef, useCallback } from 'react';
import '../../styles/expression.css';

// ── Data ─────────────────────────────────────────────────────────────────────

const TASKS = [
  {
    id: 'T1',
    label: 'Tâche 1 — Réagir',
    prepTime: 0,
    responseTime: 90,   // 1 min 30 s
    subjects: [
      'Un ami vous propose de partir en randonnée ce week-end mais vous avez déjà un engagement. Réagissez et proposez une autre date.',
      'Votre collègue vous demande de l\'aide pour un projet urgent alors que vous êtes très occupé(e). Répondez de façon appropriée.',
      'Vous êtes au restaurant et le plat commandé n\'est pas celui que vous avez demandé. Signalez le problème au serveur.',
      'Un inconnu vous demande son chemin pour aller à la gare. Expliquez-lui l\'itinéraire.',
    ],
  },
  {
    id: 'T2',
    label: 'Tâche 2 — Monologue',
    prepTime: 120,      // 2 min prep
    responseTime: 120,  // 2 min response
    subjects: [
      'Parlez d\'une expérience de voyage qui vous a marqué(e) : où, quand, avec qui et pourquoi c\'était mémorable.',
      'Décrivez votre métier ou vos études et expliquez pourquoi vous avez fait ce choix.',
      'Parlez d\'une habitude culturelle de votre pays qui vous semble importante à préserver.',
      'Décrivez un film, un livre ou une série qui vous a beaucoup marqué(e) et expliquez pourquoi.',
    ],
  },
  {
    id: 'T3',
    label: 'Tâche 3 — Point de vue',
    prepTime: 180,      // 3 min prep
    responseTime: 180,  // 3 min response
    subjects: [
      'Est-il préférable de travailler en équipe ou de façon individuelle ? Donnez votre avis et défendez-le.',
      'Pensez-vous que les réseaux sociaux rapprochent ou éloignent les gens ? Argumentez.',
      'Faut-il encourager les enfants à apprendre plusieurs langues dès le plus jeune âge ? Développez votre réponse.',
      'La ville ou la campagne : où préférez-vous vivre et pourquoi ? Comparez les deux modes de vie.',
    ],
  },
];

const CECRL_GRID = [
  {
    criterion: 'Capacité à interagir',
    levels: { A1: 'Répond avec mots isolés.', A2: 'Échange simple possible.', B1: 'Maintient un échange.', B2: 'Interagit avec aisance.', C1: 'Très à l\'aise.', C2: 'Expert.' },
  },
  {
    criterion: 'Cohérence & cohésion',
    levels: { A1: 'Juxtaposition.', A2: 'Connecteurs simples.', B1: 'Liens logiques basiques.', B2: 'Bonne organisation.', C1: 'Très bien structuré.', C2: 'Discours maîtrisé.' },
  },
  {
    criterion: 'Phonologie',
    levels: { A1: 'Très peu compréhensible.', A2: 'Compréhensible malgré accent.', B1: 'Généralement clair.', B2: 'Bonne prononciation.', C1: 'Naturelle et précise.', C2: 'Quasi native.' },
  },
  {
    criterion: 'Lexique & grammaire',
    levels: { A1: 'Vocabulaire très limité.', A2: 'Structures de base.', B1: 'Vocabulaire suffisant.', B2: 'Étendue et précision.', C1: 'Riche et nuancé.', C2: 'Maîtrise totale.' },
  },
];

function fmtTime(s) {
  if (s <= 0) s = 0;
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const IcoMic = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);
const IcoStop = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
  </svg>
);
const IcoClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcoChevron = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    style={{ transform: open ? 'rotate(90deg)' : 'none', transition: '200ms' }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

const PHASE = { IDLE: 'idle', PREP: 'prep', RESPONSE: 'response', DONE: 'done' };

const ExpressionOrale = () => {
  const [taskIdx,    setTaskIdx]    = useState(0);
  const [subjectIdx, setSubjectIdx] = useState(0);
  const [phase,      setPhase]      = useState(PHASE.IDLE);
  const [timeLeft,   setTimeLeft]   = useState(null);
  const [gridOpen,   setGridOpen]   = useState(false);
  const [micError,   setMicError]   = useState('');

  // Recording state
  const [recording,   setRecording]   = useState(false);
  const [audioURL,    setAudioURL]    = useState(null);
  const mediaRecRef   = useRef(null);
  const chunksRef     = useRef([]);
  const intervalRef   = useRef(null);

  const task    = TASKS[taskIdx];
  const subject = task.subjects[subjectIdx];

  // Reset when task/subject changes
  useEffect(() => {
    stopRecording();
    setPhase(PHASE.IDLE);
    setTimeLeft(null);
    setAudioURL(null);
    setMicError('');
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [taskIdx, subjectIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const startCountdown = useCallback((duration, onEnd) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(duration);
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          onEnd();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  const startPrep = useCallback(() => {
    if (task.prepTime > 0) {
      setPhase(PHASE.PREP);
      startCountdown(task.prepTime, () => setPhase(PHASE.RESPONSE));
    } else {
      setPhase(PHASE.RESPONSE);
    }
  }, [task.prepTime, startCountdown]);

  const startResponse = useCallback(() => {
    setPhase(PHASE.RESPONSE);
    if (intervalRef.current) clearInterval(intervalRef.current);
    startCountdown(task.responseTime, () => {
      stopRecording();
      setPhase(PHASE.DONE);
    });
  }, [task.responseTime, startCountdown]); // eslint-disable-line react-hooks/exhaustive-deps

  async function startRecording() {
    setMicError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecRef.current = mr;
      setRecording(true);
    } catch {
      setMicError('Accès au microphone refusé. Autorisez l\'accès dans les paramètres de votre navigateur.');
    }
  }

  function stopRecording() {
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      mediaRecRef.current.stop();
    }
    setRecording(false);
  }

  const tc = timeLeft !== null && timeLeft <= 30 ? 'xp-timer--danger'
    : timeLeft !== null && timeLeft <= 60 ? 'xp-timer--warning' : '';

  const phaseLabel = {
    [PHASE.IDLE]:     'Prêt à commencer',
    [PHASE.PREP]:     'Temps de préparation',
    [PHASE.RESPONSE]: 'Temps de réponse',
    [PHASE.DONE]:     'Terminé',
  };

  return (
    <main>
      <div className="xp-page">
        {/* Hero */}
        <div className="xp-hero">
          <p className="xp-hero__kicker">TCF — Production</p>
          <h1 className="xp-hero__h1">Expression orale</h1>
          <p className="xp-hero__sub">
            Choisissez une tâche, préparez-vous, enregistrez votre réponse localement et auto-évaluez-vous avec la grille CECRL.
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
          <p className="xp-subject-card__text">{subject}</p>
          <p className="xp-subject-card__meta">
            {task.prepTime > 0 ? `Préparation : ${task.prepTime / 60} min · ` : ''}
            Réponse : {task.responseTime / 60 < 1 ? `${task.responseTime}s` : `${task.responseTime / 60} min`}
          </p>
        </div>

        {/* Timer strip */}
        <div className="xp-timer-strip">
          <div>
            <p style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--tx-3)', marginBottom: '4px' }}>
              {phaseLabel[phase]}
            </p>
            <div className={`xp-timer ${tc}`}>
              <IcoClock />
              {timeLeft !== null ? fmtTime(timeLeft)
                : phase === PHASE.PREP ? fmtTime(task.prepTime)
                  : fmtTime(task.responseTime)}
            </div>
          </div>

          <div className="xp-timer-btns">
            {phase === PHASE.IDLE && (
              <button className="xp-timer-btn xp-timer-btn--primary" onClick={startPrep}>
                {task.prepTime > 0 ? 'Démarrer la préparation' : 'Démarrer'}
              </button>
            )}
            {phase === PHASE.PREP && (
              <button className="xp-timer-btn xp-timer-btn--primary" onClick={startResponse}>
                Passer à la réponse
              </button>
            )}
            {phase === PHASE.RESPONSE && !recording && (
              <button className="xp-timer-btn xp-timer-btn--primary" onClick={startRecording}>
                <IcoMic size={14} /> Enregistrer
              </button>
            )}
            {phase === PHASE.RESPONSE && recording && (
              <button className="xp-timer-btn" style={{ color: '#DC2626', borderColor: '#DC2626' }} onClick={stopRecording}>
                Arrêter l'enregistrement
              </button>
            )}
            {phase !== PHASE.IDLE && (
              <button className="xp-timer-btn" onClick={() => { setPhase(PHASE.IDLE); setTimeLeft(null); clearInterval(intervalRef.current); stopRecording(); setAudioURL(null); }}>
                Recommencer
              </button>
            )}
          </div>
        </div>

        {/* Recorder */}
        <div className="xp-recorder">
          {micError && <p className="xp-mic-warning">{micError}</p>}

          {phase !== PHASE.RESPONSE && phase !== PHASE.DONE ? (
            <p style={{ color: 'var(--tx-3)', fontSize: '.875rem' }}>
              {phase === PHASE.IDLE
                ? 'Appuyez sur « Démarrer » puis activez l\'enregistrement pendant votre réponse.'
                : 'Préparez-vous… L\'enregistrement sera disponible au début du temps de réponse.'}
            </p>
          ) : (
            <>
              <button
                className={`xp-record-btn${recording ? ' xp-record-btn--recording' : ''}`}
                onClick={recording ? stopRecording : startRecording}
                aria-label={recording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement'}
                disabled={phase === PHASE.DONE && !recording}
              >
                {recording ? <IcoStop /> : <IcoMic />}
              </button>
              <p className="xp-record-label">
                {recording ? 'Enregistrement en cours…' : audioURL ? 'Enregistrement terminé' : 'Appuyez pour enregistrer'}
              </p>
            </>
          )}

          {audioURL && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <p style={{ fontSize: '.8rem', color: 'var(--tx-3)' }}>Réécoute locale — non envoyée</p>
              <audio className="xp-audio-player" controls src={audioURL} />
              <button
                className="xp-timer-btn"
                style={{ fontSize: '.75rem' }}
                onClick={() => { setAudioURL(null); chunksRef.current = []; }}
              >
                Supprimer l'enregistrement
              </button>
            </div>
          )}
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
          <strong>Confidentialité :</strong> L'enregistrement reste local dans votre navigateur. Il n'est jamais envoyé à un serveur. Fermez l'onglet pour l'effacer définitivement. Cette simulation ne remplace pas l'évaluation d'un examinateur certifié TCF.
        </div>
      </div>
    </main>
  );
};

export default ExpressionOrale;
