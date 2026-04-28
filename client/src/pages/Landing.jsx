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
          Play the #1 Free
          <br />
          <span className="gradient-text">IPL Auction Game</span>
        </h1>

        <p className="hero-subtitle">
          Build your dream IPL team in real-time multiplayer auctions. Bid on 100+ players
          including Virat Kohli, MS Dhoni & Jasprit Bumrah. Compete with friends or AI bots — free to play!
        </p>

        <div className="hero-actions">
          <Link to="/signup" className="btn btn-gold btn-lg">
            🚀 Play Free Now
          </Link>
          <Link to="/rules" className="btn btn-outline btn-lg">
            📖 Auction Rules
          </Link>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="stat-value">100+</div>
            <div className="stat-label">Real Players</div>
          </div>
          <div className="hero-stat">
            <div className="stat-value">10</div>
            <div className="stat-label">IPL Teams</div>
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

      {/* SEO Content Sections — Keyword-Rich, Crawlable Text */}
      <article className="seo-content-section">
        <section className="seo-block">
          <h2 className="seo-heading">What is IPL Auction Game?</h2>
          <p>
            <strong>IPL Auction Game</strong> is the most immersive, free-to-play <strong>online IPL auction simulator</strong> available
            on the web. Step into the shoes of an IPL franchise owner and experience the thrill of the <strong>IPL mega auction</strong> live
            from your browser. Our <strong>multiplayer cricket auction</strong> platform lets you bid against friends and intelligent AI bots
            in real-time, managing a <strong>₹120 Crore budget</strong> to assemble the perfect squad of batsmen, bowlers, all-rounders, and
            wicketkeepers from a pool of <strong>100+ real cricket players</strong>.
          </p>
          <p>
            Whether you're a die-hard IPL fan wanting to relive the <strong>IPL 2026 auction</strong> drama or a cricket strategist who believes
            they can outsmart every franchise, this is your game. Every decision matters — overspend on a marquee star, and you'll struggle
            to fill your squad. Play it too safe, and watch rivals snap up game-changers. This is <strong>fantasy IPL auction</strong> taken to
            the next level.
          </p>
        </section>

        <section className="seo-block">
          <h2 className="seo-heading">How to Play IPL Auction Online</h2>
          <ol className="seo-steps">
            <li>
              <strong>Create a free account</strong> — Sign up in seconds with just your email. No downloads or payments required.
            </li>
            <li>
              <strong>Create or join an auction lobby</strong> — Start a private lobby and share the code with friends, or join an existing one.
              Up to 10 IPL franchises can compete in a single auction.
            </li>
            <li>
              <strong>Pick your IPL franchise</strong> — Choose from all 10 official teams: CSK, MI, RCB, KKR, DC, PBKS, RR, SRH, GT, and LSG.
            </li>
            <li>
              <strong>Bid in real-time</strong> — Players are presented one-by-one starting from Legend tier. Place bids within the countdown
              timer. The highest bidder wins the player. Automatic bid increments follow authentic IPL auction rules.
            </li>
            <li>
              <strong>Build the strongest squad</strong> — After all players are auctioned, each team is scored on star power, squad balance,
              batting/bowling strength, budget efficiency, and overseas mix. The highest-rated team wins!
            </li>
          </ol>
        </section>

        <section className="seo-block">
          <h2 className="seo-heading">Why Play Our IPL Auction Simulator?</h2>
          <div className="seo-features-grid">
            <div className="seo-feature">
              <h3>⚡ Real-Time Multiplayer</h3>
              <p>
                Powered by WebSocket technology, every bid updates instantly across all players.
                Experience the same adrenaline rush as a live <strong>IPL auction</strong> broadcast.
              </p>
            </div>
            <div className="seo-feature">
              <h3>🤖 Smart AI Opponents</h3>
              <p>
                Don't have enough friends online? Fill empty slots with AI franchises that bid
                strategically based on player value, squad needs, and budget remaining.
              </p>
            </div>
            <div className="seo-feature">
              <h3>🏏 100+ Real Players</h3>
              <p>
                Bid on actual cricket stars across 5 tiers — Legends like MS Dhoni and AB de Villiers,
                Marquee stars like Kohli and Bumrah, and emerging talent in Tier B and C.
              </p>
            </div>
            <div className="seo-feature">
              <h3>📊 Advanced Analytics</h3>
              <p>
                Post-auction team evaluation scores each squad out of 100 across six dimensions:
                star power, balance, batting, bowling, efficiency, and overseas mix.
              </p>
            </div>
            <div className="seo-feature">
              <h3>🎮 Authentic Rules</h3>
              <p>
                Real IPL auction mechanics — budget caps of ₹120 Cr, max 25 players, overseas limit of 8,
                tiered base prices, and dynamic bid increments from ₹5L to ₹50L.
              </p>
            </div>
            <div className="seo-feature">
              <h3>🆓 100% Free</h3>
              <p>
                No downloads. No In-app purchases. No subscriptions. Create an account and start playing
                the best <strong>IPL auction game</strong> online — completely free, forever.
              </p>
            </div>
          </div>
        </section>

        <section className="seo-block seo-faq-section">
          <h2 className="seo-heading">Frequently Asked Questions about IPL Auction Game</h2>
          <div className="seo-faq-list">
            <details className="seo-faq-item">
              <summary>What is IPL Auction Game?</summary>
              <p>
                IPL Auction Game is a free, online multiplayer cricket auction simulator where you can build
                your dream IPL team by bidding on 100+ real cricket players. Compete with friends or AI bots
                in real-time auctions with authentic IPL rules, budget constraints, and squad limits.
              </p>
            </details>
            <details className="seo-faq-item">
              <summary>How do I play IPL Auction Game online?</summary>
              <p>
                Simply create a free account, start or join an auction lobby, pick your IPL franchise, and
                start bidding! Each team gets ₹120 Crore budget to build a squad of up to 25 players.
                The auction features real-time bidding with countdown timers and automatic bid increments.
              </p>
            </details>
            <details className="seo-faq-item">
              <summary>Is IPL Auction Game free to play?</summary>
              <p>
                Yes! IPL Auction Game is completely free to play. No downloads required — just open the
                website in your browser and start building your dream IPL team immediately.
              </p>
            </details>
            <details className="seo-faq-item">
              <summary>Can I play IPL Auction with my friends?</summary>
              <p>
                Absolutely! Create a private auction lobby and share the lobby code with friends. Up to 10
                teams can join a single auction. Empty slots can be filled with smart AI bots that bid
                strategically.
              </p>
            </details>
            <details className="seo-faq-item">
              <summary>How many players are available in the IPL Auction Game?</summary>
              <p>
                The game features 100+ real cricket players across 5 tiers: Legend (retired greats like
                MS Dhoni, AB de Villiers), Marquee (superstars like Virat Kohli, Jasprit Bumrah),
                Tier A, Tier B, and Tier C. Players include both Indian and overseas cricketers.
              </p>
            </details>
          </div>
        </section>

        <section className="seo-block seo-cta-section">
          <h2 className="seo-heading">Ready to Start Your IPL Auction?</h2>
          <p>
            Join thousands of cricket fans already playing the most authentic IPL Auction Game online.
            Create your free account, invite your friends, and prove you're the ultimate franchise owner.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-gold btn-lg">
              🏏 Start Playing Free
            </Link>
            <Link to="/about" className="btn btn-outline btn-lg">
              Learn More About the Game
            </Link>
            <Link to="/guide" className="btn btn-outline btn-lg">
              📈 Strategy Guide
            </Link>
          </div>
        </section>
      </article>
    </div>
  );
}
