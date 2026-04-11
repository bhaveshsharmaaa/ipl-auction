import { Link } from 'react-router-dom';

export default function Rules() {
  return (
    <div className="page">
      <div className="rules-page container">
        <h1>📖 IPL Auction Rules</h1>

        <div className="rule-section glass-card">
          <h3>💰 Budget & Squad</h3>
          <ul>
            <li>Each team starts with a budget of <strong>₹100 Crore</strong> (10,000 Lakhs).</li>
            <li>Maximum squad size: <strong>25 players</strong>.</li>
            <li>Minimum squad size: <strong>18 players</strong>.</li>
            <li>Maximum overseas (non-Indian) players: <strong>8</strong>.</li>
            <li>Teams must manage their budget wisely to build a balanced squad.</li>
          </ul>
        </div>

        <div className="rule-section glass-card">
          <h3>🏏 Bidding Process</h3>
          <ul>
            <li>Players are presented one at a time, starting from <strong>Marquee</strong> tier, then <strong>Tier A</strong>, <strong>Tier B</strong>, and <strong>Tier C</strong>.</li>
            <li>Bidding starts from the player's <strong>base price</strong>.</li>
            <li>Each team can place a bid by clicking the bid button during the active timer.</li>
            <li>The highest bidder cannot bid again consecutively — someone else must bid first.</li>
            <li>A <strong>30-second countdown timer</strong> starts for each player. The timer resets after each new bid.</li>
          </ul>
        </div>

        <div className="rule-section glass-card">
          <h3>📈 Bid Increments</h3>
          <ul>
            <li>₹0 – ₹1 Cr (0-100L): Increment of <strong>₹5 Lakhs</strong></li>
            <li>₹1 Cr – ₹2 Cr (100-200L): Increment of <strong>₹10 Lakhs</strong></li>
            <li>₹2 Cr – ₹5 Cr (200-500L): Increment of <strong>₹20 Lakhs</strong></li>
            <li>₹5 Cr – ₹10 Cr (500-1000L): Increment of <strong>₹25 Lakhs</strong></li>
            <li>Above ₹10 Cr (1000L+): Increment of <strong>₹50 Lakhs</strong></li>
          </ul>
        </div>

        <div className="rule-section glass-card">
          <h3>🔨 Sold & Unsold</h3>
          <ul>
            <li>When the timer expires and there is a valid bid, the player is <strong>SOLD</strong> to the highest bidder.</li>
            <li>If no one bids on a player, the player is marked <strong>UNSOLD</strong>.</li>
            <li>Once sold, the player's price is deducted from the buying team's budget.</li>
            <li>The auction moves to the next player automatically.</li>
          </ul>
        </div>

        <div className="rule-section glass-card">
          <h3>⚠️ Bid Validation</h3>
          <ul>
            <li>You cannot bid if your budget is insufficient (keeping in mind the minimum squad requirement).</li>
            <li>You cannot bid if you've reached the maximum squad size (25).</li>
            <li>You cannot bid on an overseas player if you've reached the overseas limit (8).</li>
            <li>The system will prevent invalid bids automatically.</li>
          </ul>
        </div>

        <div className="rule-section glass-card">
          <h3>🏁 Auction End</h3>
          <ul>
            <li>The auction ends when all players in the pool have been auctioned.</li>
            <li>It also ends if no team can afford to bid on any more players.</li>
            <li>After the auction, each team is <strong>automatically evaluated</strong> and scored out of 100.</li>
          </ul>
        </div>

        <div className="rule-section glass-card">
          <h3>🏆 Post-Auction Evaluation</h3>
          <ul>
            <li><strong>Star Power (25 pts):</strong> Quality of marquee and top-tier players in your squad.</li>
            <li><strong>Squad Balance (20 pts):</strong> Role distribution — batsmen, bowlers, all-rounders, wicketkeepers.</li>
            <li><strong>Budget Efficiency (15 pts):</strong> How much stat value you got per crore spent.</li>
            <li><strong>Batting Strength (15 pts):</strong> Aggregate batting averages and strike rates of your top 7.</li>
            <li><strong>Bowling Strength (15 pts):</strong> Aggregate wickets and economy of your top 6 bowlers.</li>
            <li><strong>Overseas Mix (10 pts):</strong> Quality and diversity of overseas picks.</li>
          </ul>
        </div>

        <div className="rule-section glass-card">
          <h3>🎮 Lobby & Admin</h3>
          <ul>
            <li>The lobby creator is the <strong>admin</strong> and controls the auction flow.</li>
            <li>Admin can <strong>pause</strong> and <strong>resume</strong> the auction at any time.</li>
            <li>Admin can <strong>skip</strong> a player (mark as unsold) if needed.</li>
            <li>The lobby supports up to <strong>10 teams</strong>.</li>
            <li>A minimum of <strong>2 teams</strong> is required to start the auction.</li>
          </ul>
        </div>

        <div className="rule-section glass-card">
          <h3>📊 Player Tiers</h3>
          <ul>
            <li><strong>⭐ Marquee:</strong> Top-tier superstars with the highest base prices (₹2 Cr).</li>
            <li><strong>🟣 Tier A:</strong> Established international players (₹1-1.5 Cr base).</li>
            <li><strong>🔵 Tier B:</strong> Experienced domestic and international players (₹50L-1 Cr base).</li>
            <li><strong>🟢 Tier C:</strong> Emerging talent and support players (₹20-75L base).</li>
          </ul>
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/dashboard" className="btn btn-gold btn-lg">
            🏏 Start an Auction
          </Link>
        </div>
      </div>
    </div>
  );
}
