import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { exercisesService } from '../../services/exercisesService';
import AnswerExplanation from '../../components/AnswerExplanation/AnswerExplanation';
import '../../styles/exerciceView.css';

// ─── Shared results screen ────────────────────────────────────────────────────

const ResultsScreen = ({ headline, percentage, circumference, targetOffset, theme, msg, score, total, onContinue, onRestart }) => {
  const [circleOffset, setCircleOffset] = useState(circumference);
  useEffect(() => {
    const t = setTimeout(() => setCircleOffset(targetOffset), 120);
    return () => clearTimeout(t);
  }, [targetOffset]);

  return (
    <div className="exercise-view-container">
      <div className="res-page">
        <h1 className="res-headline">{headline}</h1>

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

        <div className="res-msg" style={{ borderColor: theme.color, background: theme.bg }}>
          <p className="res-msg__body">{msg}</p>
        </div>

        <div className="res-stats">
          <div className="res-stat">
            <span className="res-stat__num" style={{ color: '#15966B' }}>{score}</span>
            <span className="res-stat__lbl">Correctes</span>
          </div>
          <div className="res-stat">
            <span className="res-stat__num" style={{ color: '#DC2626' }}>{total - score}</span>
            <span className="res-stat__lbl">Incorrectes</span>
          </div>
          <div className="res-stat">
            <span className="res-stat__num">{total}</span>
            <span className="res-stat__lbl">Questions</span>
          </div>
        </div>

        <div className="res-actions">
          <button className="btn-primary btn-large" onClick={onContinue}>
            Continuer
          </button>
          <button className="res-link-btn" onClick={onContinue}>
            Revoir mes erreurs
          </button>
        </div>
        <button className="res-restart-link" onClick={onRestart}>
          Recommencer
        </button>
      </div>
    </div>
  );
};

// ─── ExerciceView ─────────────────────────────────────────────────────────────

const ExerciceView = () => {
  const { category, level } = useParams();
  const navigate = useNavigate();
  
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    loadExercises();
  }, [category, level]);

  // Reset timer when question changes
  useEffect(() => {
    setStartTime(Date.now());
  }, [currentIndex]);

  const loadExercises = async () => {
    try {
      const data = await exercisesService.getAll({
        category,
        level,
        limit: 10
      });
      setExercises(data.data);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentExercise = exercises[currentIndex];
  const progress = exercises.length > 0 ? ((currentIndex + 1) / exercises.length) * 100 : 0;

  const handleValidate = async () => {
    if (!currentExercise) return;

    let correct = false;

    if (currentExercise.type === 'mcq') {
      // Parse choices
      const choices = typeof currentExercise.choices === 'string'
        ? JSON.parse(currentExercise.choices)
        : currentExercise.choices;

      // Get correct answer
      const correctAnswer = currentExercise.answer;
      
      // Check if answer is a number (index) or a string (value)
      let correctIndex;
      if (typeof correctAnswer === 'number') {
        correctIndex = correctAnswer;
      } else if (!isNaN(parseInt(correctAnswer))) {
        correctIndex = parseInt(correctAnswer);
      } else {
        // Answer is the text value, find its index
        correctIndex = choices.findIndex(choice => 
          choice.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
        );
      }
      
      correct = selectedOption === correctIndex;
      
    } else if (currentExercise.type === 'fill_blank') {
      const userAnswerClean = userAnswer.trim().toLowerCase();
      const correctAnswerClean = currentExercise.answer.trim().toLowerCase();
      correct = userAnswerClean === correctAnswerClean;
    }

    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      setScore(score + 1);
    }

    // Save attempt to database with time tracking
    const timeSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    
    try {
      await exercisesService.submitAttempt({
        exerciseId: currentExercise.id,
        score: correct ? 1 : 0,
        maxScore: 1,
        percentage: correct ? 100 : 0,
        timeSpent: timeSpent,
        answers: currentExercise.type === 'mcq' ? { selectedOption } : { userAnswer }
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la tentative:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetQuestion();
    } else {
      setShowResults(true);
    }
  };

  const resetQuestion = () => {
    setUserAnswer('');
    setSelectedOption(null);
    setShowFeedback(false);
    setIsCorrect(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setShowResults(false);
    resetQuestion();
  };

  if (loading) {
    return (
      <div className="exercise-view-container">
        <p style={{ textAlign: 'center', color: '#757575', fontSize: '1.1rem' }}>
          Chargement des exercices...
        </p>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="exercise-view-container">
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#111111' }}>
            Aucun exercice disponible
          </h2>
          <p style={{ color: '#757575', marginBottom: '2rem' }}>
            Il n'y a pas d'exercices pour cette catégorie et ce niveau.
          </p>
          <button onClick={() => navigate('/exercices')} className="btn-primary">
            Retour aux exercices
          </button>
        </div>
      </div>
    );
  }

  // Results View
  if (showResults) {
    const percentage  = exercises.length ? Math.round((score / exercises.length) * 100) : 0;
    const circumference = 2 * Math.PI * 75;
    const targetOffset  = circumference - (percentage / 100) * circumference;

    const theme = percentage >= 70
      ? { stroke: '#15966B', color: '#15966B', bg: '#EDFBF5' }
      : percentage >= 40
        ? { stroke: '#4338CA', color: '#4338CA', bg: '#EEF0FB' }
        : { stroke: '#D97706', color: '#D97706', bg: '#FEF8EC' };

    const headline = percentage >= 90 ? `${score} / ${exercises.length} — Excellent !`
      : percentage >= 70 ? `${score} / ${exercises.length} — Bien joué !`
      : percentage >= 40 ? `${score} / ${exercises.length} — Continuez !`
      : `${score} / ${exercises.length} — Ne lâchez pas !`;

    const msg = percentage >= 70
      ? 'Belle performance ! Continuez à pratiquer pour consolider vos acquis.'
      : percentage >= 40
        ? "C'est un bon début. Retentez ce niveau pour consolider vos acquis."
        : 'Ce niveau est exigeant. Revenez sur les explications et retentez pour voir votre progression.';

    return (
      <ResultsScreen
        headline={headline}
        percentage={percentage}
        circumference={circumference}
        targetOffset={targetOffset}
        theme={theme}
        msg={msg}
        score={score}
        total={exercises.length}
        onContinue={() => navigate('/exercices')}
        onRestart={handleRestart}
      />
    );
  }

  // Exercise View
  const getCorrectIndex = () => {
    if (!currentExercise || currentExercise.type !== 'mcq') return -1;
    
    const choices = typeof currentExercise.choices === 'string'
      ? JSON.parse(currentExercise.choices)
      : currentExercise.choices;
    
    const correctAnswer = currentExercise.answer;
    
    if (typeof correctAnswer === 'number') {
      return correctAnswer;
    } else if (!isNaN(parseInt(correctAnswer))) {
      return parseInt(correctAnswer);
    } else {
      return choices.findIndex(choice => 
        choice.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
      );
    }
  };

  const correctIndex = getCorrectIndex();

  return (
    <div className="exercise-view-container">
      {/* Question counter + progress */}
      <div className="ev-topbar">
        <button className="ev-back" onClick={() => navigate('/exercices')}>
          Quitter
        </button>
        <span className="ev-breadcrumb">
          <span className="ev-pos">Question {currentIndex + 1} / {exercises.length}</span>
        </span>
      </div>
      <div className="ev-progress">
        <div className="ev-progress__fill" style={{ width: `${progress}%`, background: 'var(--primary)' }} />
      </div>

      {/* Question Card */}
      <div className="question-card">
        <div className="question-number">
          Question {currentIndex + 1}
        </div>

        {currentExercise?.context && (
          <div className="question-context">{currentExercise.context}</div>
        )}

        <div className="question-prompt">{currentExercise?.prompt}</div>

        {/* MCQ Type */}
        {currentExercise?.type === 'mcq' && currentExercise?.choices && (
          <div className="answers-grid">
            {(() => {
              const choices = typeof currentExercise.choices === 'string'
                ? JSON.parse(currentExercise.choices)
                : currentExercise.choices;
              
              return choices.map((choice, index) => {
                let className = 'answer-option';
                
                if (showFeedback) {
                  className += ' disabled';
                  
                  if (index === selectedOption && isCorrect) {
                    className += ' correct';
                  } else if (index === selectedOption && !isCorrect) {
                    className += ' incorrect';
                  } else if (index === correctIndex) {
                    className += ' correct';
                  }
                } else if (index === selectedOption) {
                  className += ' selected';
                }

                const labels = ['A', 'B', 'C', 'D'];
                return (
                  <button
                    key={index}
                    className={className}
                    data-index={labels[index] || index + 1}
                    onClick={() => !showFeedback && setSelectedOption(index)}
                  >
                    {choice}
                  </button>
                );
              });
            })()}
          </div>
        )}

        {/* Fill Blank Type */}
        {currentExercise?.type === 'fill_blank' && (
          <div className="fill-blank-container">
            <input
              type="text"
              className={`fill-blank-input ${showFeedback ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Votre réponse..."
              disabled={showFeedback}
            />
          </div>
        )}

        {/* Feedback */}
        <div role="status" aria-live="polite" aria-atomic="true">
          {showFeedback && (
            <div className={`feedback-zone ${isCorrect ? 'correct' : 'incorrect'}`}>
              <div className="feedback-icon">{isCorrect ? '✓' : '✗'}</div>
              <div className="feedback-content">
                <div className="feedback-title">
                  {isCorrect ? 'Correct !' : 'Incorrect'}
                </div>
                <div className="feedback-explanation">
                  <AnswerExplanation
                    explanation={currentExercise?.explanation}
                    distractors={currentExercise?.distractors}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="exercise-actions">
        {!showFeedback ? (
          <button 
            className="btn-validate"
            onClick={handleValidate}
            disabled={
              (currentExercise?.type === 'mcq' && selectedOption === null) ||
              (currentExercise?.type === 'fill_blank' && !userAnswer.trim())
            }
          >
            Valider
          </button>
        ) : (
          <button className="btn-next" onClick={handleNext}>
            {currentIndex === exercises.length - 1 ? 'Voir les résultats' : 'Suivant'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ExerciceView;