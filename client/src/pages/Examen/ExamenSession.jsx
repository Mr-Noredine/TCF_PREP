import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examenService } from '../../services/examenService';
import ExamSupport from '../../components/ExamSupport/ExamSupport';
import { cleanExercisePrompt } from '../../utils/exerciseDisplay';
import '../../styles/exerciceView.css';
import '../../styles/examen.css';

const IcoClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

function fmtTime(s) {
  if (s == null || s < 0) s = 0;
  const m   = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function timerClass(t) {
  if (t <= 60)  return 'exb-timer--danger';
  if (t <= 180) return 'exb-timer--warning';
  return '';
}

const EPREUVE_LABELS = {
  comprehension_orale:  'Compréhension orale',
  comprehension_ecrite: 'Compréhension écrite',
  structures_langue:    'Structures de la langue',
};

const ExamenSession = () => {
  const { sessionId } = useParams();
  const navigate      = useNavigate();

  const [questions,     setQuestions]     = useState([]);
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [selectedOpt,   setSelectedOpt]   = useState(null);
  const [timeLeft,      setTimeLeft]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [submitting,    setSubmitting]    = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);

  const isFinishingRef = useRef(false);

  // ── Finish exam (auto or manual) ──────────────────────────────────────────
  const finishExam = useCallback(async () => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    try {
      await examenService.terminerExamen(sessionId);
    } catch (_) { /* already finished */ }
    navigate(`/examen/resultats/${sessionId}`, { replace: true });
  }, [sessionId, navigate]);

  // ── Load session ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const data = await examenService.getSession(sessionId);

        if (data.expired || data.finished) {
          navigate(`/examen/resultats/${sessionId}`, { replace: true });
          return;
        }

        setQuestions(data.questions);

        // Resume at first unanswered question
        const answered = new Set((data.answers || []).map(a => a.question_order));
        const first = data.questions.findIndex(q => !answered.has(q.question_order));
        setCurrentIndex(first >= 0 ? first : 0);

        // Timer: use server-computed time_left
        setTimeLeft(Math.max(0, data.session.time_left));
      } catch (err) {
        console.error('getSession error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId, navigate]);

  // ── Countdown ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft !== null, finishExam]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Validate answer ───────────────────────────────────────────────────────
  const handleValidate = async () => {
    if (selectedOpt === null || submitting) return;
    setSubmitting(true);

    const q = questions[currentIndex];
    try {
      await examenService.submitAnswer(sessionId, q.question_order, selectedOpt);
    } catch (_) { /* network hiccup — answer is saved on retry */ }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedOpt(null);
    } else {
      await finishExam();
    }

    setSubmitting(false);
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="exercise-view-container">
        <p style={{ textAlign: 'center', color: 'var(--tx-3)', paddingTop: '4rem' }}>
          Chargement de l'examen…
        </p>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="exercise-view-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <p>Session introuvable ou expirée.</p>
        <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/examen')}>
          Retour
        </button>
      </div>
    );
  }

  const q        = questions[currentIndex];
  const choices  = q.choices
    ? (typeof q.choices === 'string' ? JSON.parse(q.choices) : q.choices)
    : [];
  const progress = ((currentIndex) / questions.length) * 100;
  const tc       = timeLeft !== null ? timerClass(timeLeft) : '';

  return (
    <div className="exb-session">
      {/* ── Topbar ── */}
      <div className="exb-topbar">
        <div className={`exb-timer ${tc}`}>
          <IcoClock />
          {fmtTime(timeLeft)}
        </div>

        <span className="exb-counter">
          Question <strong>{currentIndex + 1}</strong> / {questions.length}
        </span>

        <button
          className="exb-btn-end"
          onClick={() => setShowConfirm(true)}
          disabled={showConfirm}
        >
          Terminer
        </button>
      </div>

      {/* Progress bar */}
      <div className="exb-progress">
        <div className="exb-progress__fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Confirm early finish */}
      {showConfirm && (
        <div className="exb-confirm">
          <p className="exb-confirm__text">
            Il vous reste <strong>{questions.length - currentIndex}</strong> question(s).
            Êtes-vous sûr de vouloir terminer ?
          </p>
          <div className="exb-confirm__actions">
            <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.875rem', minHeight: '36px' }} onClick={finishExam}>
              Terminer
            </button>
            <button className="btn-secondary" style={{ padding: '8px 20px', fontSize: '0.875rem', minHeight: '36px' }} onClick={() => setShowConfirm(false)}>
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* ── Question card ── */}
      <div className="question-card" style={{ borderTop: '3px solid var(--primary)', marginTop: '0.5rem' }}>
        <div className="exb-epreuve-badge">
          {EPREUVE_LABELS[q.epreuve] || q.epreuve} · {q.level}
        </div>

        <ExamSupport support={q.support} questionKey={q.question_order} />

        {q.context && (
          <div className="question-context">{q.context}</div>
        )}

        <div className="question-prompt">{cleanExercisePrompt(q.prompt)}</div>

        {q.type === 'mcq' && (
          <div className="answers-grid">
            {choices.map((choice, idx) => (
              <button
                key={idx}
                className={`answer-option${selectedOpt === idx ? ' selected' : ''}`}
                data-index={['A', 'B', 'C', 'D'][idx] || idx + 1}
                onClick={() => setSelectedOpt(idx)}
              >
                {choice}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="exercise-actions" style={{ justifyContent: 'flex-end' }}>
        <button
          className="exb-btn-validate"
          onClick={handleValidate}
          disabled={selectedOpt === null || submitting}
        >
          {submitting
            ? 'Enregistrement…'
            : currentIndex < questions.length - 1
              ? 'Valider et continuer'
              : 'Terminer l\'examen'}
        </button>
      </div>
    </div>
  );
};

export default ExamenSession;
