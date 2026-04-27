import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const { login, adminLogin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isAdminMode) {
        await adminLogin(adminUsername, adminPassword);
        toast.success('🔑 Admin access granted!');
      } else {
        await login(email, password);
        toast.success('Welcome back!');
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <h1>{isAdminMode ? '🔑 Admin Login' : 'Welcome Back'}</h1>
        <p className="auth-subtitle">
          {isAdminMode ? 'Enter admin credentials to manage the platform' : 'Sign in to join the auction'}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isAdminMode ? (
            <>
              <div className="input-group">
                <label htmlFor="admin-username">Username</label>
                <input
                  id="admin-username"
                  type="text"
                  className="input-field"
                  placeholder="Admin username"
                  value={adminUsername}
                  onChange={e => setAdminUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="input-group">
                <label htmlFor="admin-password">Password</label>
                <input
                  id="admin-password"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </>
          ) : (
            <>
              <div className="input-group">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className={`btn ${isAdminMode ? 'btn-danger' : 'btn-primary'} btn-lg`}
            disabled={loading}
          >
            {loading ? <span className="spinner spinner-sm"></span> : isAdminMode ? '🔑 Admin Sign In' : '🏏 Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          {isAdminMode ? (
            <span>
              Not an admin? <a href="#" onClick={(e) => { e.preventDefault(); setIsAdminMode(false); setError(''); }}>User Login</a>
            </span>
          ) : (
            <>
              Don't have an account? <Link to="/signup">Sign up</Link>
              <span style={{ display: 'block', marginTop: 12 }}>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setIsAdminMode(true); setError(''); }}
                  style={{ 
                    fontSize: 12, 
                    color: 'var(--text-tertiary)', 
                    opacity: 0.6,
                    transition: 'opacity 0.2s' 
                  }}
                  onMouseEnter={e => e.target.style.opacity = '1'}
                  onMouseLeave={e => e.target.style.opacity = '0.6'}
                >
                  🔑 Admin Access
                </a>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
