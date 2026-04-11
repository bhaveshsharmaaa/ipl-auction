import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing-hero">
      <div className="floating-ball"></div>
      <div className="floating-ball"></div>
      <div className="floating-ball"></div>

      <div className="hero-content">
        <div className="hero-badge">
          🏆 The Ultimate Cricket Auction Experience
        </div>

        <h1 className="hero-title">
          Build Your
          <br />
          <span className="gradient-text">Dream IPL Team</span>
        </h1>

        <p className="hero-subtitle">
          Compete with friends in real-time IPL-style auctions. Bid strategically,
          build a balanced squad, and prove you're the ultimate franchise owner.
        </p>

        <div className="hero-actions">
          <Link to="/signup" className="btn btn-gold btn-lg">
            🚀 Get Started
          </Link>
          <Link to="/rules" className="btn btn-outline btn-lg">
            📖 Auction Rules
          </Link>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="stat-value">100+</div>
            <div className="stat-label">Players</div>
          </div>
          <div className="hero-stat">
            <div className="stat-value">10</div>
            <div className="stat-label">Teams per Lobby</div>
          </div>
          <div className="hero-stat">
            <div className="stat-value">₹120 Cr</div>
            <div className="stat-label">Budget per Team</div>
          </div>
          <div className="hero-stat">
            <div className="stat-value">Live</div>
            <div className="stat-label">Real-time Bidding</div>
          </div>
        </div>
      </div>
    </div>
  );
}
