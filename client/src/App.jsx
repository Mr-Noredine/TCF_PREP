import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Auth from './pages/Auth/Auth';
import Exercises from './pages/Exercises/Exercises';
import ExerciceView from './pages/ExerciceView/ExerciceView';
import ExerciceItem from './pages/ExerciceView/ExerciceItem';
import QuizActive from './pages/QuizActive/QuizActive';
import QuizResults from './pages/QuizResults/QuizResults';
import Dashboard from './pages/Dashboard/Dashboard';
import Examen from './pages/Examen/Examen';
import ExamenSession from './pages/Examen/ExamenSession';
import ExamenResultats from './pages/Examen/ExamenResultats';
import Expression from './pages/Expression/Expression';
import ExpressionEcrite from './pages/Expression/ExpressionEcrite';
import ExpressionOrale from './pages/Expression/ExpressionOrale';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <p style={{ fontSize: '1.2rem', color: '#757575' }}>Chargement...</p>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/auth" replace />;
};

function App() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isExercisePage = /^\/exercice\//.test(location.pathname);
  const isExamSession  = /^\/examen\/session\//.test(location.pathname);
  const hideChrome     = isExercisePage || isExamSession;

  return (
    <div className="App">
      <a className="skip-link" href="#contenu">Aller au contenu</a>
      {!hideChrome && <Header />}

      <main id="contenu" className="app-main" tabIndex="-1">
      <Routes>
        <Route
          path="/"
          element={
            loading ? null : user ? <Navigate to="/dashboard" replace /> : <Home />
          }
        />
        <Route path="/auth" element={<Auth />} />
        <Route path="/exercices" element={<ProtectedRoute><Exercises /></ProtectedRoute>} />
        <Route path="/exercice/:id" element={<ProtectedRoute><ExerciceItem /></ProtectedRoute>} />
        <Route path="/exercice/:category/:level" element={<ProtectedRoute><ExerciceView /></ProtectedRoute>} />
        <Route path="/quiz/active" element={<ProtectedRoute><QuizActive /></ProtectedRoute>} />
        <Route path="/quiz/results" element={<ProtectedRoute><QuizResults /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/examen" element={<ProtectedRoute><Examen /></ProtectedRoute>} />
        <Route path="/examen/session/:sessionId" element={<ProtectedRoute><ExamenSession /></ProtectedRoute>} />
        <Route path="/examen/resultats/:sessionId" element={<ProtectedRoute><ExamenResultats /></ProtectedRoute>} />
        <Route path="/expression" element={<ProtectedRoute><Expression /></ProtectedRoute>} />
        <Route path="/expression-ecrite" element={<ProtectedRoute><ExpressionEcrite /></ProtectedRoute>} />
        <Route path="/expression-orale" element={<ProtectedRoute><ExpressionOrale /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </main>

      {!hideChrome && <Footer />}
    </div>
  );
}

export default App;