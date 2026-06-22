import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { quizService } from '../../services/quizService';
import '../../styles/quizActive.css';

const QuizActive = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { category, level } = location.state || {};

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    if (!category || !level) {
      navigate('/quiz');
      return;
    }
    loadQuiz();
  }, [category, level]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadQuiz = async () => {
    try {
      const data = await quizService.getQuestions(category.slug, level, 25);
      setQuestions(data.quiz.questions);
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // Get correct index intelligently
  const getCorrectIndex = (question) => {
    if (!question) return -1;
    
    const choices = question.choices 
      ? (typeof question.choices === 'string' 
          ? JSON.parse(question.choices) 
          : question.choices)
      : [];
    
    const correctAnswer = question.answer;
    const norm = s => s.trim().replace(/[   ⁠]/g, ' ').replace(/\s+/g, ' ').toLowerCase();

    if (typeof correctAnswer === 'number') return correctAnswer;
    if (/^\d+$/.test(String(correctAnswer).trim())) return parseInt(correctAnswer, 10);
    return choices.findIndex(c => norm(c) === norm(String(correctAnswer)));
  };

  const handleAnswerSelect = (index) => {
    if (!showFeedback) {
      setSelectedAnswer(index);
    }
  };

  const handleValidate = () => {
    if (selectedAnswer === null) return;

    const correctIndex = getCorrectIndex(currentQuestion);
    const isCorrect = selectedAnswer === correctIndex;
    
    console.log('Quiz Validation:', {
      selectedAnswer,
      correctIndex,
      correctAnswer: currentQuestion.answer,
      isCorrect
    });
    
    if (isCorrect) {
      setScore(score + 1);
    }

    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Navigate to results
      navigate('/quiz/results', {
        state: {
          score,
          total: questions.length,
          category,
          level,
          timeElapsed
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="quiz-active-container">
        <p style={{ textAlign: 'center', color: '#757575', fontSize: '1.1rem', paddingTop: '4rem' }}>
          Chargement du quiz...
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="quiz-active-container">
        <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#111111' }}>
            Aucune question disponible
          </h2>
          <p style={{ color: '#757575', marginBottom: '2rem' }}>
            Il n'y a pas de questions pour cette catégorie et ce niveau.
          </p>
          <button onClick={() => navigate('/quiz')} className="btn-primary">
            Retour au quiz
          </button>
        </div>
      </div>
    );
  }

  const choices = currentQuestion.choices 
    ? (typeof currentQuestion.choices === 'string' 
        ? JSON.parse(currentQuestion.choices) 
        : currentQuestion.choices)
    : [];
  
  const correctIndex = getCorrectIndex(currentQuestion);

  return (
    <div className="quiz-active-container">
      {/* Header */}
      <div className="quiz-header">
        <div className="quiz-info">
          <h2>{category?.name} - Niveau {level}</h2>
          <p>Quiz TCF • {questions.length} questions</p>
        </div>
        <div className="quiz-timer">
          <span className="timer-icon">⏱️</span>
          <span className="timer-text">{formatTime(timeElapsed)}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="quiz-progress">
        <div className="progress-header">
          <span className="progress-label">Progression</span>
          <span className="question-counter">
            Question {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Question */}
      <div className="quiz-question-section">
        <div className="quiz-question-number">
          QUESTION {currentIndex + 1}
        </div>
        
        <div className="quiz-question-text">
          {currentQuestion.prompt}
        </div>

        <div className="quiz-answers">
          {choices.map((choice, index) => {
            let className = 'quiz-answer-btn';
            
            if (showFeedback) {
              className += ' disabled';
              if (index === selectedAnswer && selectedAnswer === correctIndex) {
                className += ' correct';
              } else if (index === selectedAnswer && selectedAnswer !== correctIndex) {
                className += ' incorrect';
              } else if (index === correctIndex) {
                className += ' correct';
              }
            } else if (index === selectedAnswer) {
              className += ' selected';
            }

            const letter = String.fromCharCode(65 + index); // A, B, C, D

            return (
              <button
                key={index}
                className={className}
                onClick={() => handleAnswerSelect(index)}
              >
                <span className="answer-letter">{letter}</span>
                <span>{choice}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="quiz-actions">
        <button 
          className="btn-quiz-quit"
          onClick={() => {
            if (confirm('Êtes-vous sûr de vouloir quitter le quiz ?')) {
              navigate('/quiz');
            }
          }}
        >
          Quitter
        </button>

        {!showFeedback ? (
          <button
            className="btn-quiz-next"
            onClick={handleValidate}
            disabled={selectedAnswer === null}
          >
            Valider
          </button>
        ) : (
          <button
            className="btn-quiz-next"
            onClick={handleNext}
          >
            {currentIndex === questions.length - 1 ? 'Voir les résultats' : 'Question suivante'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizActive;