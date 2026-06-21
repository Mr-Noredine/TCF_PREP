import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { exercisesService } from '../../services/exercisesService';
import ExamSupport from '../../components/ExamSupport/ExamSupport';
import AnswerExplanation from '../../components/AnswerExplanation/AnswerExplanation';
import '../../styles/exerciceView.css';

const IcoArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IcoArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);


function formatSessionDuration(startedAt) {
  const total = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}min ${String(seconds).padStart(2, '0')}s`;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function useFocusTrap(onClose) {
  const trapRef = useRef(null);

  useEffect(() => {
    const node = trapRef.current;
    if (!node) return undefined;

    const getFocusable = () => Array.from(node.querySelectorAll(FOCUSABLE_SELECTOR))
      .filter(el => !el.hasAttribute('aria-hidden'));

    const focusTimer = window.setTimeout(() => {
      getFocusable()[0]?.focus();
    }, 0);

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !node.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return trapRef;
}

const SessionRecap = ({ stats, startedAt, onContinue, onExit }) => {
  const dialogRef = useFocusTrap(onContinue);
  const pct = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0;
  const answerLabel = stats.correct === 1 ? 'bonne réponse' : 'bonnes réponses';
  const message = pct === 100
    ? 'Sans-faute. Tu maîtrises ce point.'
    : pct >= 70
      ? 'Belle session, tu progresses bien.'
      : pct >= 40
        ? 'Continue, ça vient. Reviens consolider ce point.'
        : 'Ce point mérite une révision. Reprends-le à tête reposée.';

  return (
    <div
      ref={dialogRef}
      className="session-recap"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-recap-title"
      aria-describedby="session-recap-message"
    >
      <div className="session-recap__panel">
        <p className="session-recap__kicker">Récap de session</p>
        <h2 id="session-recap-title" className="session-recap__title">
          {stats.correct} {answerLabel} sur {stats.answered}
        </h2>
        <p id="session-recap-message" className="session-recap__message">{message}</p>

        <div className="session-recap__score">
          <span>{pct}%</span>
          <small>Score de session</small>
        </div>

        <div className="session-recap__stats">
          <div><strong>{stats.correct}</strong><span>Correctes</span></div>
          <div><strong>{stats.answered - stats.correct}</strong><span>Incorrectes</span></div>
          <div><strong>{formatSessionDuration(startedAt)}</strong><span>Durée</span></div>
        </div>

        <div className="session-recap__actions">
          <button className="session-recap__secondary" onClick={onContinue}>Continuer</button>
          <button className="session-recap__primary" onClick={onExit}>Retour à la bibliothèque</button>
        </div>
      </div>
    </div>
  );
};

const ExerciceItem = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();

  const { exercises: exerciseList = [], currentIndex = 0 } = location.state || {};

  const [exercise,      setExercise]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [selectedOpt,   setSelectedOpt]   = useState(null);
  const [userAnswer,    setUserAnswer]     = useState('');
  const [showFeedback,  setShowFeedback]  = useState(false);
  const [isCorrect,     setIsCorrect]     = useState(false);
  const [questionStart, setQuestionStart]  = useState(Date.now());
  const sessionStartedAt                   = useRef(Date.now());
  const [sessionStats, setSessionStats]    = useState({ answered: 0, correct: 0 });
  const [showSessionRecap, setShowSessionRecap] = useState(false);
  const recapTriggerRef                         = useRef(null);

  useEffect(() => {
    setLoading(true);
    setSelectedOpt(null);
    setUserAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
    setQuestionStart(Date.now());
    exercisesService.getById(id)
      .then(res => setExercise(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="exercise-view-container">
        <p style={{ textAlign: 'center', color: '#64748B', paddingTop: '4rem' }}>Chargement…</p>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="exercise-view-container" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Exercice introuvable</h2>
        <Link to="/exercices" className="btn-primary">Retour à la bibliothèque</Link>
      </div>
    );
  }

  // ── Parse choices ──────────────────────────────────────────────────────────
  const choices = exercise.type === 'mcq'
    ? (typeof exercise.choices === 'string' ? JSON.parse(exercise.choices) : exercise.choices)
    : [];

  const correctIndex = (() => {
    if (exercise.type !== 'mcq') return -1;
    const a = exercise.answer;
    if (typeof a === 'number') return a;
    if (!isNaN(parseInt(a)))   return parseInt(a);
    return choices.findIndex(c => c.trim().toLowerCase() === String(a).trim().toLowerCase());
  })();

  // ── Validate ───────────────────────────────────────────────────────────────
  const handleValidate = async () => {
    let correct = false;

    if (exercise.type === 'mcq') {
      correct = selectedOpt === correctIndex;
    } else if (exercise.type === 'fill_blank') {
      correct = userAnswer.trim().toLowerCase() === exercise.answer.trim().toLowerCase();
    }

    setIsCorrect(correct);
    setShowFeedback(true);

    const timeSpent = Math.max(1, Math.round((Date.now() - questionStart) / 1000));
    setSessionStats(prev => ({
      answered: prev.answered + 1,
      correct: prev.correct + (correct ? 1 : 0),
    }));

    try {
      await exercisesService.submitAttempt({
        exerciseId: exercise.id,
        score: correct ? 1 : 0,
        maxScore: 1,
        percentage: correct ? 100 : 0,
        timeSpent,
        answers: exercise.type === 'mcq' ? { selectedOpt } : { userAnswer },
      });
    } catch (e) {
      console.error('Erreur sauvegarde:', e);
    }
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const prevId   = currentIndex > 0                    ? exerciseList[currentIndex - 1]?.id : null;
  const nextId   = currentIndex < exerciseList.length - 1 ? exerciseList[currentIndex + 1]?.id : null;
  const isLast   = currentIndex === exerciseList.length - 1;
  const hasNav   = exerciseList.length > 0;

  const goTo = (targetId, targetIndex) => {
    navigate(`/exercice/${targetId}`, {
      state: { exercises: exerciseList, currentIndex: targetIndex },
    });
  };

  const closeSessionRecap = () => {
    setShowSessionRecap(false);
    window.requestAnimationFrame(() => {
      recapTriggerRef.current?.focus?.();
    });
  };

  const requestExit = event => {
    if (sessionStats.answered === 0) {
      navigate('/exercices');
      return;
    }

    if (event?.currentTarget) {
      recapTriggerRef.current = event.currentTarget;
    } else if (document.activeElement instanceof HTMLElement) {
      recapTriggerRef.current = document.activeElement;
    }

    setShowSessionRecap(true);
  };

  // ── Progress ───────────────────────────────────────────────────────────────
  const progress = hasNav ? ((currentIndex + 1) / exerciseList.length) * 100 : 0;
  const questionAnnouncement = hasNav
    ? `Question ${currentIndex + 1} sur ${exerciseList.length}, ${exercise.category_name}, niveau ${exercise.level}.`
    : `Question ${exercise.category_name}, niveau ${exercise.level}.`;

  // ── Theme by category ──────────────────────────────────────────────────────
  const COLORS = {
    reading_comprehension: '#4338CA',
    grammar:               '#5B54C9',
    conjugation:           '#4F6BD6',
    vocabulary:            '#6366A8',
  };
  const accentColor = COLORS[exercise.category_slug] || '#4F46E5';

  return (
    <div className="exercise-view-container">
      <div className="exercise-view-main" inert={showSessionRecap ? '' : undefined}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="ev-topbar">
        <button className="ev-back" onClick={requestExit} aria-label="Retour à la bibliothèque">
          <IcoArrowLeft /> Bibliothèque
        </button>

        <div className="ev-breadcrumb">
          <span className="ev-cat" style={{ color: accentColor }}>{exercise.category_name}</span>
          <span className="ev-sep">·</span>
          <span className="ev-lvl">Niveau {exercise.level}</span>
          {hasNav && (
            <>
              <span className="ev-sep">·</span>
              <span className="ev-pos">{currentIndex + 1} / {exerciseList.length}</span>
            </>
          )}
        </div>
      </div>

      {/* ── Progress bar ────────────────────────────────────────────────── */}
      {hasNav && (
        <div className="ev-progress">
          <div className="ev-progress__fill" style={{ width: `${progress}%`, background: accentColor }} />
        </div>
      )}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {questionAnnouncement}
      </p>

      {/* ── Question card ───────────────────────────────────────────────── */}
      <div className="question-card" style={{ borderTop: `3px solid ${accentColor}` }}>
        <div className="question-number" style={{ color: accentColor }}>
          {exercise.category_name} · {exercise.level}
        </div>

        <ExamSupport support={exercise.support} questionKey={exercise.id} />

        {exercise.context && !exercise.support && (
          <div className="question-context">{exercise.context}</div>
        )}

        <div className="question-prompt">{exercise.prompt}</div>

        {/* MCQ */}
        {exercise.type === 'mcq' && (
          <div className="answers-grid">
            {choices.map((choice, idx) => {
              let cls = 'answer-option';
              if (showFeedback) {
                cls += ' disabled';
                if (idx === selectedOpt && isCorrect)  cls += ' correct';
                else if (idx === selectedOpt)           cls += ' incorrect';
                else if (idx === correctIndex)          cls += ' correct';
              } else if (idx === selectedOpt) {
                cls += ' selected';
              }
              return (
                <button
                  key={idx}
                  className={cls}
                  data-index={['A','B','C','D'][idx] || idx + 1}
                  onClick={() => !showFeedback && setSelectedOpt(idx)}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        )}

        {/* Fill blank */}
        {exercise.type === 'fill_blank' && (
          <div className="fill-blank-container">
            <input
              type="text"
              className={`fill-blank-input${showFeedback ? (isCorrect ? ' correct' : ' incorrect') : ''}`}
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !showFeedback && userAnswer.trim() && handleValidate()}
              placeholder="Votre réponse…"
              disabled={showFeedback}
              autoFocus
            />
          </div>
        )}

        {/* Feedback */}
        {showFeedback && (
          <div
            className={`feedback-zone ${isCorrect ? 'correct' : 'incorrect'}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="feedback-icon">{isCorrect ? '✓' : '✗'}</div>
            <div className="feedback-content">
              <div className="feedback-title">
                {isCorrect ? 'Correct !' : `Incorrect — La bonne réponse : ${exercise.type === 'mcq' ? choices[correctIndex] : exercise.answer}`}
              </div>
              <div className="feedback-explanation">
                <AnswerExplanation
                  explanation={exercise.explanation}
                  distractors={exercise.distractors}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="exercise-actions">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-quit-text" onClick={requestExit}>
            Quitter
          </button>
          {hasNav && prevId && (
            <button
              className="btn-quit-text"
              onClick={() => goTo(prevId, currentIndex - 1)}
              aria-label="Exercice précédent"
            >
              <IcoArrowLeft /> Préc.
            </button>
          )}
        </div>

        {!showFeedback ? (
          <button
            className="btn-validate"
            onClick={handleValidate}
            disabled={
              (exercise.type === 'mcq'        && selectedOpt === null) ||
              (exercise.type === 'fill_blank' && !userAnswer.trim())
            }
          >
            Valider
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isLast && nextId ? (
              <button className="btn-next" onClick={() => goTo(nextId, currentIndex + 1)}>
                Suivant <IcoArrow />
              </button>
            ) : (
              <button className="btn-next" onClick={requestExit}>
                Retour à la bibliothèque <IcoArrow />
              </button>
            )}
          </div>
        )}
      </div>

      </div>

      {showSessionRecap && (
        <SessionRecap
          stats={sessionStats}
          startedAt={sessionStartedAt.current}
          onContinue={closeSessionRecap}
          onExit={() => navigate('/exercices')}
        />
      )}
    </div>
  );
};

export default ExerciceItem;
