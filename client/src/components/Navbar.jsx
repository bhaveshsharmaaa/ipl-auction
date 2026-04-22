import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitial } from '../utils/helpers';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={user ? '/dashboard' : '/'} className="navbar-brand">
          <span className="logo-icon">🏏</span>
          <span className="brand-text">IPL Auction</span>
        </Link>

        <div className="navbar-nav">
          {user ? (
            <>
              <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
              <NavLink to="/rules" className="nav-link">Rules</NavLink>
              <NavLink to="/completed" className="nav-link">Completed Auctions</NavLink>
              <div className="navbar-user">
                <div
                  className="avatar avatar-sm"
                  style={{ background: user.avatar || '#7c2dff' }}
                >
                  {getInitial(user.username)}
                </div>
                <span className="username">{user.username}</span>
                <button className="btn btn-outline btn-sm" onClick={logout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/about" className="nav-link">About</NavLink>
              <NavLink to="/rules" className="nav-link">Rules</NavLink>
              <NavLink to="/login" className="nav-link">Login</NavLink>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
