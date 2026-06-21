import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { useExerciseCount } from '../../hooks/useExerciseCount';
import '../../styles/auth.css';


const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [activeTab, setActiveTab] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setActiveTab(initialMode);
    setError('');
  }, [initialMode]);
  const { login, loginWithGoogle, register } = useAuth();
  const hasGoogleAuth = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const { count: exerciseCount, loading: countLoading, error: countError } = useExerciseCount();

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    const result = await loginWithGoogle(credentialResponse.credential);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  // Login form data
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Register form data
  const [registerData, setRegisterData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    level: 'A1'
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(loginData.email, loginData.password);
    
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await register(registerData);
    
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { label: '', className: '' };
    if (password.length < 6) return { label: 'Faible', className: 'weak' };
    if (password.length < 8) return { label: 'Moyen', className: 'fair' };
    if (password.length < 12) return { label: 'Bon', className: 'good' };
    return { label: 'Fort', className: 'strong' };
  };

  const passwordStrength = getPasswordStrength(registerData.password);

  return (
    <main>
      <h1 className="sr-only">
        {activeTab === 'login' ? 'Connexion' : 'Créer un compte'}
      </h1>
      <section className="auth-section">
        <div className="auth-container">
          <div className="auth-image">
            <img
              src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800"
              alt="Étudiant qui prépare son examen"
              loading="lazy"
            />
            <div className="auth-image-overlay"></div>
            <div className="auth-image-text">
              <h2>Commencez votre parcours</h2>
              <p>
                {countLoading
                  ? <>… questions · 5 catégories · niveaux A1 à C2 · 100&nbsp;% gratuit.</>
                  : <>{countError ? '600+' : exerciseCount} questions · 5 catégories · niveaux A1 à C2 · 100&nbsp;% gratuit.</>
                }
              </p>
            </div>
          </div>

          <div className="auth-forms">
            {/* Tabs */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('login');
                  setError('');
                }}
              >
                Connexion
              </button>
              <button
                className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('register');
                  setError('');
                }}
              >
                Créer un compte
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                padding: '12px',
                background: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '0.9rem',
                marginBottom: '20px'
              }}>
                {error}
              </div>
            )}

            {hasGoogleAuth && (
              <>
                {/* Google button — visible on both tabs */}
                <div className="auth-google">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Connexion Google annulée ou échouée')}
                    width="100%"
                    shape="rectangular"
                    theme="outline"
                    size="large"
                    text="continue_with"
                    locale="fr"
                  />
                </div>

                <div className="auth-divider">
                  <span>ou</span>
                </div>
              </>
            )}

            {/* Login Form */}
            {activeTab === 'login' && (
              <form className="auth-form" onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label htmlFor="login-email">Email</label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      id="login-email"
                      placeholder="votre@email.com"
                      required
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="login-password">Mot de passe</label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login-password"
                      placeholder="Votre mot de passe"
                      required
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-primary btn-full" disabled={loading}>
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>

                <p className="auth-switch">
                  Pas de compte ?{' '}
                  <button
                    type="button"
                    className="switch-tab"
                    onClick={() => setActiveTab('register')}
                  >
                    Créer un compte
                  </button>
                </p>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form className="auth-form" onSubmit={handleRegisterSubmit}>
                <div className="form-row-two">
                  <div className="form-group">
                    <label htmlFor="reg-firstname">Prénom</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        id="reg-firstname"
                        autoComplete="given-name"
                        required
                        value={registerData.firstname}
                        onChange={(e) => setRegisterData({ ...registerData, firstname: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="reg-lastname">Nom</label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        id="reg-lastname"
                        autoComplete="family-name"
                        required
                        value={registerData.lastname}
                        onChange={(e) => setRegisterData({ ...registerData, lastname: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reg-email">Email</label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      id="reg-email"
                      autoComplete="email"
                      required
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reg-password">Mot de passe</label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="reg-password"
                      autoComplete="new-password"
                      required
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {registerData.password && (
                    <div className="password-strength">
                      <div className={`strength-bar ${passwordStrength.className}`}></div>
                      <span className="strength-label">{passwordStrength.label}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="reg-level">Niveau actuel</label>
                  <div className="input-wrapper select-wrapper">
                    <select
                      id="reg-level"
                      value={registerData.level}
                      onChange={(e) => setRegisterData({ ...registerData, level: e.target.value })}
                    >
                      <option value="A1">A1 - Débutant</option>
                      <option value="A2">A2 - Élémentaire</option>
                      <option value="B1">B1 - Intermédiaire</option>
                      <option value="B2">B2 - Intermédiaire avancé</option>
                      <option value="C1">C1 - Avancé</option>
                      <option value="C2">C2 - Maîtrise</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-primary btn-full" disabled={loading}>
                  {loading ? 'Création...' : 'Créer mon compte'}
                </button>

                <p className="auth-switch">
                  Déjà un compte ?{' '}
                  <button
                    type="button"
                    className="switch-tab"
                    onClick={() => setActiveTab('login')}
                  >
                    Se connecter
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Auth;
