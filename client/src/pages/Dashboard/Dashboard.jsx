import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { exercisesService } from '../../services/exercisesService';
import { examenService } from '../../services/examenService';
import { summarizeByCategory, summarizeExercises, getExerciseBestScore } from '../../utils/exerciseStatus';
import StatsCards from './StatsCards';
import ProgressChart from './ProgressChart';
import CategoryStats from './CategoryStats';
import QuizHistory from './QuizHistory';
import Recommendations from './Recommendations';
import '../../styles/dashboard.css';

const IcoArrow = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const IcoRepeat = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
  </svg>
);
const IcoZap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [exerciseSummary, setExerciseSummary] = useState(null);
  const [examHistory, setExamHistory]         = useState([]);
  const [lastExamLevel, setLastExamLevel]     = useState(null);
  const [exerciseList, setExerciseList]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, exerciseListData, attemptsData, timelineData, recsData, examHistData, lastLvlData] = await Promise.all([
        dashboardService.getStats(),
        exercisesService.getList(),
        dashboardService.getAttempts(10, 0),
        dashboardService.getTimeline(),
        dashboardService.getRecommendations(),
        examenService.getHistory(5).catch(() => ({ data: [] })),
        examenService.getLastLevel().catch(() => ({ level: null })),
      ]);

      const exerciseList = exerciseListData.data || [];

      setStats(statsData);
      setExerciseList(exerciseList);
      setExerciseSummary(summarizeExercises(exerciseList));
      setProgress(summarizeByCategory(exerciseList).filter(row => row.completed_exercises > 0));
      setAttempts(attemptsData.data || []);
      setTimeline(timelineData.data || []);
      setRecommendations(recsData.data);
      setExamHistory(examHistData.data || []);
      setLastExamLevel(lastLvlData.level || null);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const avgScore = Math.round(stats?.overall?.average_score || 0);
  const hasAttempts = (stats?.overall?.total_exercises_completed || 0) > 0;
  const scoreLevel = avgScore >= 80 ? 'B2' : avgScore >= 60 ? 'B1' : avgScore >= 40 ? 'A2' : 'A1';
  const level = lastExamLevel || (hasAttempts ? scoreLevel : null);

  // ── Review & session du jour ───────────────────────────────────────────────
  const reviewExercises = exerciseList.filter(ex => {
    const s = getExerciseBestScore(ex);
    return s !== null && s < 70;
  });
  const newExercises = exerciseList.filter(ex => getExerciseBestScore(ex) === null);

  const startSession = useCallback(() => {
    // 5 review (worst first) + 5 new (random)
    const reviewPick = [...reviewExercises]
      .sort((a, b) => getExerciseBestScore(a) - getExerciseBestScore(b))
      .slice(0, 5);
    const newPick = [...newExercises]
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    const session = [...reviewPick, ...newPick].map((ex, idx) => ({
      id: ex.id, category_name: ex.category_name, category_slug: ex.category_slug, level: ex.level, _idx: idx,
    }));
    if (session.length === 0) return;
    navigate(`/exercice/${session[0].id}`, { state: { exercises: session, currentIndex: 0 } });
  }, [reviewExercises, newExercises, navigate]);

  if (loading) {
    return (
      <div className="ds-page">
        <div className="ds-loading">
          <span className="ds-spinner" />
          Chargement de votre tableau de bord…
        </div>
      </div>
    );
  }

  return (
    <div className="ds-page">
      {/* ── Page header ── */}
      <header className="ds-header">
        <div className="ds-header__left">
          <p className="ds-header__greeting">Tableau de bord</p>
          <h1 className="ds-header__title">Bonjour, {user?.firstname} !</h1>
          <p className="ds-header__sub">Voici un aperçu de votre progression TCF.</p>
        </div>
        <div className="ds-header__right">
          {level ? (
            <span className="ds-level-badge" title={lastExamLevel ? 'Basé sur votre dernier examen blanc' : 'Estimé depuis votre entraînement — passez un examen blanc pour affiner'}>
              <span className="ds-level-badge__dot" />
              Niveau estimé {level}
            </span>
          ) : (
            <Link to="/examen" className="ds-level-badge ds-level-badge--neutral" style={{ textDecoration: 'none' }}>
              <span className="ds-level-badge__dot" style={{ background: '#9CA3AF' }} />
              Passez un examen blanc
            </Link>
          )}
          <Link to="/exercices" className="btn-primary" style={{ fontSize: '.8rem', padding: '8px 18px' }}>
            Continuer
          </Link>
        </div>
      </header>

      {/* ── Stat cards ── */}
      <StatsCards stats={stats} exerciseSummary={exerciseSummary} />

      {/* ── Action rapide : session du jour + réviser ── */}
      {(reviewExercises.length > 0 || newExercises.length > 0) && (
        <div className="ds-quick-actions">
          <div className="ds-quick-card ds-quick-card--session">
            <div className="ds-quick-card__left">
              <span className="ds-quick-card__ico"><IcoZap /></span>
              <div>
                <p className="ds-quick-card__title">Session du jour</p>
                <p className="ds-quick-card__sub">
                  {Math.min(5, reviewExercises.length)} révisions + {Math.min(5, newExercises.length)} nouveaux
                </p>
              </div>
            </div>
            <button className="btn-primary" style={{ fontSize: '.8rem', padding: '8px 18px' }} onClick={startSession}>
              Commencer <IcoArrow />
            </button>
          </div>

          {reviewExercises.length > 0 && (
            <Link to="/exercices?status=a-revoir" className="ds-quick-card ds-quick-card--review" style={{ textDecoration: 'none' }}>
              <div className="ds-quick-card__left">
                <span className="ds-quick-card__ico ds-quick-card__ico--warn"><IcoRepeat /></span>
                <div>
                  <p className="ds-quick-card__title">Réviser mes erreurs</p>
                  <p className="ds-quick-card__sub">{reviewExercises.length} exercice{reviewExercises.length > 1 ? 's' : ''} à consolider</p>
                </div>
              </div>
              <span className="ds-quick-badge">{reviewExercises.length}</span>
            </Link>
          )}
        </div>
      )}

      {/* ── Chart + Recommendations side by side ── */}
      <div className="ds-two-col">
        <ProgressChart timeline={timeline} />

        <section className="ds-section">
          <div className="ds-section-head">
            <h2 className="ds-section-title">Recommandations</h2>
          </div>
          <Recommendations recommendations={recommendations} />
        </section>
      </div>

      {/* ── Category performance ── */}
      <section className="ds-section">
        <div className="ds-section-head">
          <h2 className="ds-section-title">Performance par catégorie</h2>
          <Link to="/exercices" className="ds-section-link">
            Tous les exercices <IcoArrow />
          </Link>
        </div>
        <CategoryStats progress={progress} />
      </section>

      {/* ── Recent history ── */}
      <section className="ds-section">
        <div className="ds-section-head">
          <h2 className="ds-section-title">Historique récent</h2>
          <Link to="/examen" className="ds-section-link">
            Examen blanc <IcoArrow />
          </Link>
        </div>
        <QuizHistory attempts={attempts} examHistory={examHistory} />
      </section>
    </div>
  );
};

export default Dashboard;
