import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { exercisesService } from '../../services/exercisesService';
import { summarizeByCategoryLevel, summarizeExercises } from '../../utils/exerciseStatus';
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

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [exerciseSummary, setExerciseSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, exerciseListData, attemptsData, timelineData, recsData] = await Promise.all([
        dashboardService.getStats(),
        exercisesService.getList(),
        dashboardService.getAttempts(10, 0),
        dashboardService.getTimeline(),
        dashboardService.getRecommendations()
      ]);

      const exerciseList = exerciseListData.data || [];

      setStats(statsData);
      setExerciseSummary(summarizeExercises(exerciseList));
      setProgress(summarizeByCategoryLevel(exerciseList).filter(row => row.completed_exercises > 0));
      setAttempts(attemptsData.data || []);
      setTimeline(timelineData.data || []);
      setRecommendations(recsData.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const avgScore = Math.round(stats?.overall?.average_score || 0);
  const level = avgScore >= 80 ? 'B2' : avgScore >= 60 ? 'B1' : avgScore >= 40 ? 'A2' : 'A1';

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
          <span className="ds-level-badge">
            <span className="ds-level-badge__dot" />
            Niveau estimé {level}
          </span>
          <Link to="/exercices" className="btn-primary" style={{ fontSize: '.8rem', padding: '8px 18px' }}>
            Continuer
          </Link>
        </div>
      </header>

      {/* ── Stat cards ── */}
      <StatsCards stats={stats} exerciseSummary={exerciseSummary} />

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
        </div>
        <QuizHistory attempts={attempts} />
      </section>
    </div>
  );
};

export default Dashboard;
