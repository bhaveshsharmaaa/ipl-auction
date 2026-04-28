import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="page">
      <article className="about-page container">
        <h1>About IPL Auction Game — The #1 Online Cricket Auction Simulator</h1>

        <section className="about-section glass-card">
          <h2>🏏 What Makes Our IPL Auction Game Special?</h2>
          <p>
            Welcome to <strong>IPL Auction Game</strong> — the most realistic, feature-rich, and exciting
            <strong> online IPL auction simulator</strong> ever built. Our platform recreates the electric atmosphere
            of the Indian Premier League mega auction, putting you in the seat of an IPL franchise owner
            with one mission: build the most powerful cricket team within your budget.
          </p>
          <p>
            Unlike basic fantasy cricket apps or simple draft tools, our <strong>IPL Auction Simulator</strong> delivers
            a fully real-time, multiplayer experience. Every bid happens live, every decision is timed, and every
            rupee counts. When the gavel falls, there's no going back — just like the real IPL auction.
          </p>
        </section>

        <section className="about-section glass-card">
          <h2>🌟 The Complete IPL Auction Experience</h2>
          <p>
            Our game features over <strong>100 real cricket players</strong> from across the cricketing world, organized
            into five competitive tiers:
          </p>
          <ul>
            <li>
              <strong>👑 Legend Tier</strong> — All-time greats and retired IPL icons like MS Dhoni, AB de Villiers,
              Chris Gayle, and Shane Warne. These players appear first in the auction with premium base prices.
            </li>
            <li>
              <strong>⭐ Marquee Tier</strong> — Current superstars like Virat Kohli, Jasprit Bumrah, Pat Cummins,
              and Rashid Khan. The most sought-after players in every auction.
            </li>
            <li>
              <strong>🟣 Tier A</strong> — Established international players commanding base prices of ₹1-1.5 Crore.
              These are the squad anchors that every team needs.
            </li>
            <li>
              <strong>🔵 Tier B</strong> — Experienced domestic and international cricketers. Smart picks in this
              tier can win you the auction.
            </li>
            <li>
              <strong>🟢 Tier C</strong> — Emerging talent, young domestic stars, and support players. These
              budget picks complete your squad and often provide the best value for money.
            </li>
          </ul>
        </section>

        <section className="about-section glass-card">
          <h2>⚡ Real-Time Multiplayer Technology</h2>
          <p>
            At the heart of our <strong>IPL Auction Game</strong> is cutting-edge WebSocket technology that makes
            every bid update instantly across all connected players. There's zero delay between placing a bid
            and seeing it reflected on everyone's screen — creating the same heart-pounding tension you feel
            watching the IPL auction live on TV.
          </p>
          <p>
            Up to <strong>10 players</strong> can compete in a single auction lobby. Create a private room and
            share the code with your cricket group, or fill empty slots with our intelligent AI bots. The AI
            franchises don't just bid randomly — they evaluate player stats, consider squad composition,
            track remaining budget, and make strategically sound decisions that will keep you on your toes.
          </p>
        </section>

        <section className="about-section glass-card">
          <h2>📊 Authentic IPL Auction Rules & Mechanics</h2>
          <p>
            Our simulator faithfully recreates the official IPL auction mechanics:
          </p>
          <ul>
            <li><strong>Budget:</strong> Each franchise starts with ₹120 Crore (12,000 Lakhs)</li>
            <li><strong>Squad Limits:</strong> Maximum 25 players, minimum 18 players per team</li>
            <li><strong>Overseas Cap:</strong> Maximum 8 overseas (non-Indian) players per squad</li>
            <li><strong>Bid Timer:</strong> 30-second countdown that resets with each new bid</li>
            <li><strong>Dynamic Increments:</strong> Bid increments increase with price — from ₹5 Lakhs at the base to ₹50 Lakhs at premium prices</li>
            <li><strong>Smart Validation:</strong> The system prevents invalid bids automatically based on budget, squad size, and overseas limits</li>
          </ul>
        </section>

        <section className="about-section glass-card">
          <h2>🏆 Post-Auction Team Analysis</h2>
          <p>
            Once the auction concludes, every team is automatically analyzed and scored across six key dimensions:
          </p>
          <ul>
            <li><strong>Star Power (25 pts)</strong> — Quality of your marquee and top-tier acquisitions</li>
            <li><strong>Squad Balance (20 pts)</strong> — Distribution across batsmen, bowlers, all-rounders, and wicketkeepers</li>
            <li><strong>Budget Efficiency (15 pts)</strong> — How much cricketing value you extracted per crore spent</li>
            <li><strong>Batting Strength (15 pts)</strong> — Aggregate averages and strike rates of your top 7 batsmen</li>
            <li><strong>Bowling Strength (15 pts)</strong> — Wickets tally and economy rates of your top 6 bowlers</li>
            <li><strong>Overseas Mix (10 pts)</strong> — Quality and diversity of your international acquisitions</li>
          </ul>
          <p>
            The team with the highest total score is declared the auction champion. Can you outsmart your friends
            and the AI to build the best IPL squad?
          </p>
        </section>

        <section className="about-section glass-card">
          <h2>🎮 All 10 IPL Franchises</h2>
          <p>
            Choose to represent any of the 10 official IPL franchises in the <strong>IPL Auction Game</strong>:
          </p>
          <div className="about-teams-grid">
            <span className="team-badge">🦁 Chennai Super Kings (CSK)</span>
            <span className="team-badge">🏏 Mumbai Indians (MI)</span>
            <span className="team-badge">👑 Royal Challengers Bengaluru (RCB)</span>
            <span className="team-badge">🏰 Kolkata Knight Riders (KKR)</span>
            <span className="team-badge">🦅 Delhi Capitals (DC)</span>
            <span className="team-badge">👊 Punjab Kings (PBKS)</span>
            <span className="team-badge">🏜️ Rajasthan Royals (RR)</span>
            <span className="team-badge">🌅 Sunrisers Hyderabad (SRH)</span>
            <span className="team-badge">💎 Gujarat Titans (GT)</span>
            <span className="team-badge">⚡ Lucknow Super Giants (LSG)</span>
          </div>
        </section>

        <section className="about-section glass-card">
          <h2>🆓 Completely Free — No Catches</h2>
          <p>
            <strong>IPL Auction Game</strong> is and will always be <strong>100% free to play</strong>. No downloads,
            no in-app purchases, no subscriptions, no ads. We built this for the love of cricket and the excitement
            of the IPL auction. All you need is a web browser and an internet connection.
          </p>
          <p>
            Whether you're planning your dream retention list during the <strong>IPL 2026 season</strong>, settling
            a debate about auction strategy with friends, or just looking for a fun <strong>cricket game online</strong>,
            our IPL Auction Simulator has you covered.
          </p>
        </section>

        <section className="about-section" style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/signup" className="btn btn-gold btn-lg">
            🏏 Start Playing Now — It's Free
          </Link>
          <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/rules" className="btn btn-outline btn-lg">
              📖 Read the Full Auction Rules
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
