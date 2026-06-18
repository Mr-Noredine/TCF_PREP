import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { quizService } from '../../services/quizService';
import '../../styles/exerciceView.css';

const QuizResults = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { score, total, category, level, timeElapsed } = location.state || {};
  const [hasSaved, setHasSaved] = useState(false);

  const percentage = total ? Math.round((score / total) * 100) : 0;
  const circumference = 2 * Math.PI * 75;
  const targetOffset  = circumference - (percentage / 100) * circumference;

  // Animate the arc after mount
  const [circleOffset, setCircleOffset] = useState(circumference);
  useEffect(() => {
    const t = setTimeout(() => setCircleOffset(targetOffset), 120);
    return () => clearTimeout(t);
  }, [targetOffset]);

  useEffect(() => {
    if (score !== undefined && total && category && level && !hasSaved) {
      saveResult();
    }
  }, [score, total, category, level, hasSaved]);

  const saveResult = async () => {
    try {
      await quizService.submitAttempt({
        category: category.slug,
        level,
        score,
        totalQuestions: total,
        percentage,
        timeSpent: timeElapsed,
        answers: {},
      });
      setHasSaved(true);
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    }
  };

  if (!score && score !== 0) {
    navigate('/quiz');
    return null;
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}min ${sec}s` : `${sec}s`;
  };

  // Theme: vert ≥70%, indigo 40-69%, ambre <40%
  const theme = percentage >= 70
    ? { stroke: '#15966B', color: '#15966B', bg: '#EDFBF5' }
    : percentage >= 40
      ? { stroke: '#4338CA', color: '#4338CA', bg: '#EEF0FB' }
      : { stroke: '#D97706', color: '#D97706', bg: '#FEF8EC' };

  const headline = percentage >= 90 ? `${score} / ${total} — Excellent !`
    : percentage >= 70 ? `${score} / ${total} — Bien joué !`
    : percentage >= 40 ? `${score} / ${total} — Continuez !`
    : `${score} / ${total} — Ne lâchez pas !`;

  const msg = percentage >= 90
    ? { title: 'Maîtrise parfaite', body: "Vous dominez ce niveau. C'est le moment de passer au niveau suivant." }
    : percentage >= 70
      ? { title: 'Très bonne performance', body: 'Quelques points à consolider, mais vous êtes clairement sur la bonne voie.' }
      : percentage >= 40
        ? { title: 'Bonne progression', body: "Retentez ce niveau pour consolider vos acquis — chaque essai compte." }
        : { title: 'Ne vous découragez pas', body: 'Revenez sur les explications de chaque réponse et retentez pour mesurer votre progression.' };

  const isLevelUp = percentage >= 70;
  const NEXT = { A1: 'A2', A2: 'B1', B1: 'B2', B2: 'C1', C1: 'C2' };

  return (
    <div className="exercise-view-container">
      <div className="res-page">

        {/* Headline */}
        <h1 className="res-headline">{headline}</h1>
        <p className="res-meta">{category?.name} · Niveau {level}</p>

        {/* Animated score circle */}
        <div className="results-score">
          <svg width="200" height="200" className="score-circle-bg" aria-hidden="true">
            <circle cx="100" cy="100" r="75" fill="none" stroke="#E6E9EF" strokeWidth="10" />
            <circle
              cx="100" cy="100" r="75"
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              style={{
                stroke: theme.stroke,
                strokeDasharray: circumference,
                strokeDashoffset: circleOffset,
                transition: 'stroke-dashoffset 1.2s cubic-bezier(0,0,.2,1)',
              }}
            />
          </svg>
          <div className="score-text">
            <span style={{ color: theme.color }}>{percentage}%</span>
          </div>
        </div>

        {/* Level-up callout */}
        {isLevelUp && NEXT[level] && (
          <p className="res-levelup">
            Seuil atteint — vous pouvez passer au niveau <strong>{NEXT[level]}</strong> !
          </p>
        )}

        {/* Message block */}
        <div className="res-msg" style={{ borderColor: theme.color, background: theme.bg }}>
          <p className="res-msg__title">{msg.title}</p>
          <p className="res-msg__body">{msg.body}</p>
        </div>

        {/* Stats row */}
        <div className="res-stats">
          <div className="res-stat">
            <span className="res-stat__num" style={{ color: '#15966B' }}>{score}</span>
            <span className="res-stat__lbl">Correctes</span>
          </div>
          <div className="res-stat">
            <span className="res-stat__num" style={{ color: '#DC2626' }}>{total - score}</span>
            <span className="res-stat__lbl">Incorrectes</span>
          </div>
          {timeElapsed > 0 && (
            <div className="res-stat">
              <span className="res-stat__num">{formatTime(timeElapsed)}</span>
              <span className="res-stat__lbl">Temps</span>
            </div>
          )}
        </div>

        {/* Actions — 2 max */}
        <div className="res-actions">
          <button className="btn-primary btn-large" onClick={() => navigate('/exercices')}>
            Continuer
          </button>
          <button className="res-link-btn" onClick={() => navigate('/exercices')}>
            Revoir mes erreurs
          </button>
        </div>

        <button className="res-restart-link" onClick={() => navigate('/quiz', { state: { category, level } })}>
          Recommencer ce niveau
        </button>
      </div>
    </div>
  );
};

export default QuizResults;
