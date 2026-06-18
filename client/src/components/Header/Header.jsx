import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const IcoLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = path => location.pathname === path ? 'nav-active' : '';
  const initial  = user?.firstname?.[0]?.toUpperCase() ?? '?';
  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className={scrolled ? 'scrolled' : ''}>
      <nav>
        <ul>
          <li>
            <Link to="/" className="nav-wordmark" aria-label="TCF Prep — Accueil">
              <span className="wm-c">TCF</span> Prep
            </Link>
          </li>
          {user ? (
            <>
              <li>
                <Link to="/exercices" className={isActive('/exercices')}>Exercices</Link>
              </li>
              <li className="nav-dashboard-link">
                <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
              </li>
            </>
          ) : (
            <li className="nav-home-link">
              <Link to="/" className={isActive('/')}>Accueil</Link>
            </li>
          )}

          {user ? (
            <li className="nav-user">
              <div className="nav-avatar" aria-hidden="true">{initial}</div>
              <span className="nav-username">{user.firstname}</span>
              <button
                onClick={handleLogout}
                className="btn-logout-icon"
                aria-label="Se déconnecter"
              >
                <IcoLogout />
                <span className="logout-text">Déconnexion</span>
              </button>
            </li>
          ) : (
            <li className="nav-auth-actions">
              <Link to="/auth?mode=login" className="btn-nav-secondary">Connexion</Link>
              <Link to="/auth?mode=register" className="btn-login">Inscription</Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
