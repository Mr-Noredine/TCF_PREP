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

  return (
    <div className="App">
      {!isExercisePage && <Header />}

      <Routes>
        <Route
          path="/"
          element={
            loading ? null : user ? <Navigate to="/exercices" replace /> : <Home />
          }
        />
        <Route path="/auth" element={<Auth />} />
        <Route path="/exercices" element={<ProtectedRoute><Exercises /></ProtectedRoute>} />
        <Route path="/exercice/:id" element={<ProtectedRoute><ExerciceItem /></ProtectedRoute>} />
        <Route path="/exercice/:category/:level" element={<ProtectedRoute><ExerciceView /></ProtectedRoute>} />
        <Route path="/quiz/active" element={<ProtectedRoute><QuizActive /></ProtectedRoute>} />
        <Route path="/quiz/results" element={<ProtectedRoute><QuizResults /></ProtectedRoute>} />
        
        {/* Protected routes (require login) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {!isExercisePage && <Footer />}
    </div>
  );
}

export default App;