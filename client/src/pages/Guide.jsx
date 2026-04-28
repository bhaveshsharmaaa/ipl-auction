import { Link } from 'react-router-dom';

export default function Guide() {
  return (
    <div className="page">
      <article className="about-page container">
        <h1>IPL Auction Game Strategy Guide — Win Every Draft</h1>

        <section className="about-section glass-card">
          <h2>🎯 Master the IPL Auction: Pro Strategy Tips</h2>
          <p>
            Winning the <strong>IPL Auction Game</strong> requires more than just buying the most expensive players.
            Smart franchise owners combine budget discipline, squad planning, and tactical patience to build
            championship-winning teams. This comprehensive <strong>IPL auction strategy guide</strong> will transform
            you from a casual bidder into a dominant auction strategist.
          </p>
          <p>
            Whether you're playing in a <strong>mini auction</strong> with 300 players or tackling the full
            <strong> mega auction</strong> with 650 players, these proven strategies apply across every format.
          </p>
        </section>

        <section className="about-section glass-card">
          <h2>💰 Budget Management Strategy</h2>
          <p>
            The single most important skill in any <strong>IPL auction game</strong> is budget management. You start
            with ₹120 Crore (12,000 Lakhs) and need to fill a squad of at least 18 players. Here's how to
            allocate your budget like a pro:
          </p>
          <h3>The 40-30-30 Rule</h3>
          <ul>
            <li><strong>40% (₹48 Cr) on Legend + Marquee players:</strong> These are your franchise cornerstones. Bid aggressively on 2-3 premium players but don't chase every star. Let overpriced players go — there's always another talent.</li>
            <li><strong>30% (₹36 Cr) on Tier A players:</strong> This is where you find your squad anchors. Experienced international players at ₹1-2 Crore offer incredible value. Target 4-5 players here.</li>
            <li><strong>30% (₹36 Cr) on Tier B + C players:</strong> The backbone of your squad. Smart picks in lower tiers often deliver the best stats-per-crore ratio, which directly boosts your Budget Efficiency score.</li>
          </ul>
        </section>

        <section className="about-section glass-card">
          <h2>⚖️ Squad Balance Strategy</h2>
          <p>
            The post-auction evaluation algorithm rewards <strong>balanced squads</strong> with up to 20 points for
            Squad Balance alone. Here's the ideal composition:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 16 }}>
            <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏏</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent-400)' }}>5-7</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Batsmen</div>
            </div>
            <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎳</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent-400)' }}>5-7</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Bowlers</div>
            </div>
            <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent-400)' }}>3-5</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>All-Rounders</div>
            </div>
            <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🧤</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent-400)' }}>2</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Wicketkeepers</div>
            </div>
          </div>
          <p style={{ marginTop: 16 }}>
            <strong>Pro tip:</strong> All-rounders are the most valuable players in any auction because they fill
            two roles simultaneously. Target all-rounders in Tier B and C where they're cheaper — players like
            experienced domestic all-rounders often deliver outstanding value.
          </p>
        </section>

        <section className="about-section glass-card">
          <h2>📈 Understanding Bid Increments</h2>
          <p>
            Knowing how <strong>bid increments</strong> work gives you a massive strategic advantage. The increments
            scale with price, just like in the real IPL auction:
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse', marginTop: 16,
              fontSize: 14, color: 'var(--text-primary)'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-primary)' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--primary-300)' }}>Current Bid</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--primary-300)' }}>Increment</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--primary-300)' }}>Strategy</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                  <td style={{ padding: '10px 16px' }}>₹0 – ₹1 Cr</td>
                  <td style={{ padding: '10px 16px', color: 'var(--success-400)', fontWeight: 700 }}>₹5 Lakhs</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>Small jumps — bid wars last long. Set a hard limit.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                  <td style={{ padding: '10px 16px' }}>₹1 – ₹2 Cr</td>
                  <td style={{ padding: '10px 16px', color: 'var(--accent-400)', fontWeight: 700 }}>₹10 Lakhs</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>Moderate pace. Good zone for Tier A steals.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                  <td style={{ padding: '10px 16px' }}>₹2 – ₹5 Cr</td>
                  <td style={{ padding: '10px 16px', color: 'var(--warning-400)', fontWeight: 700 }}>₹20 Lakhs</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>Getting expensive. Only chase players you truly need.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                  <td style={{ padding: '10px 16px' }}>₹5 – ₹10 Cr</td>
                  <td style={{ padding: '10px 16px', color: 'var(--danger-400)', fontWeight: 700 }}>₹25 Lakhs</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>Premium zone. Every bid is a major budget commitment.</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 16px' }}>₹10 Cr+</td>
                  <td style={{ padding: '10px 16px', color: '#ff3b30', fontWeight: 700 }}>₹50 Lakhs</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>Danger zone. Only for must-have marquee stars.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="about-section glass-card">
          <h2>🤖 Beating AI Opponents</h2>
          <p>
            Our <strong>AI bots</strong> are smart — they evaluate player statistics, consider squad composition,
            and manage their budgets strategically. But they have patterns you can exploit:
          </p>
          <ul>
            <li><strong>AI teams always bid on marquee players</strong> — Use this to drain their budgets early. Let them overspend on the first few superstars, then dominate the later rounds when they're budget-constrained.</li>
            <li><strong>AI values all-rounders highly</strong> — If you need an all-rounder, bid early and decisively. The longer a bidding war lasts, the more AI teams pile in.</li>
            <li><strong>AI respects overseas limits</strong> — If you notice an AI team approaching 8 overseas players, target the overseas players they can't afford to bid on.</li>
            <li><strong>AI fills roles methodically</strong> — Once an AI has enough bowlers, it won't chase more. Track their squad composition to predict their behavior.</li>
          </ul>
        </section>

        <section className="about-section glass-card">
          <h2>🏆 Maximizing Your Team Score</h2>
          <p>
            Your final team is scored across six dimensions. Here's how to maximize each one:
          </p>
          <ul>
            <li><strong>Star Power (25 pts):</strong> Having 2-3 Marquee/Legend players is enough. Diminishing returns after that — don't blow your entire budget on superstars.</li>
            <li><strong>Squad Balance (20 pts):</strong> Follow the 5-7/5-7/3-5/2 rule above. This is the easiest dimension to max out if you plan ahead.</li>
            <li><strong>Budget Efficiency (15 pts):</strong> Get value picks in Tier B and C. Players with high stats but low prices directly boost this score.</li>
            <li><strong>Batting Strength (15 pts):</strong> Your top 7 batsmen's combined average and strike rate matter. Don't just collect names — check the actual stats.</li>
            <li><strong>Bowling Strength (15 pts):</strong> Economy rate and wickets of your top 6 bowlers. Prioritize bowlers with low economy over those with high wicket totals.</li>
            <li><strong>Overseas Mix (10 pts):</strong> Aim for 4-6 quality overseas players. Having exactly the right number (not maxing 8) with high stats is ideal.</li>
          </ul>
        </section>

        <section className="about-section glass-card">
          <h2>🎮 Format-Specific Strategies</h2>
          <h3>Small Auction (150 Players)</h3>
          <p>
            With only 150 players in the pool, competition is fierce for every quality player. Be aggressive early —
            there are fewer alternatives if you miss out on a key target. Budget management is less critical here
            because the auction ends faster.
          </p>
          <h3>Mini Auction (300 Players)</h3>
          <p>
            The standard experience balances strategy and speed. The 40-30-30 budget rule works perfectly here.
            There are enough players to recover from early overspending, but not so many that you can afford to
            be completely passive.
          </p>
          <h3>Mega Auction (650 Players)</h3>
          <p>
            The ultimate strategic challenge. With 650 players, patience is the key virtue. The best strategy is to
            let other teams overspend in early rounds, then dominate the massive Tier B and C pools where the
            hidden gems live. Budget discipline is absolutely critical in mega auctions.
          </p>
        </section>

        <section className="about-section glass-card">
          <h2>❓ Strategy FAQ</h2>
          <details className="seo-faq-item">
            <summary>What's the best strategy for beginners?</summary>
            <p>
              Start with Mini Auction format. Don't bid on the first 3-4 players — observe how others bid and what prices
              settle at. Then target your first pick in the Tier A range where competition is lower. Build a balanced squad
              first, then fill with stars.
            </p>
          </details>
          <details className="seo-faq-item">
            <summary>Should I save budget for later rounds?</summary>
            <p>
              Absolutely. The most common mistake in the IPL Auction Game is blowing 60%+ of budget on Legend and Marquee
              players. Always keep at least 40% for Tier B and C — that's where the best value-for-money players are.
            </p>
          </details>
          <details className="seo-faq-item">
            <summary>How do I beat AI bots consistently?</summary>
            <p>
              Let AI teams fight each other for expensive players. Track their budgets and overseas counts. When an AI team
              is low on budget, you can get players for base price. Also, target players in positions the AI teams have
              already filled — they won't bid.
            </p>
          </details>
          <details className="seo-faq-item">
            <summary>What's more important: Star Power or Squad Balance?</summary>
            <p>
              Squad Balance (20 pts) is almost as valuable as Star Power (25 pts), and it's much easier to control. A
              perfectly balanced team with moderate stars will outscore a star-heavy but unbalanced team every time.
            </p>
          </details>
        </section>

        <section className="about-section" style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/signup" className="btn btn-gold btn-lg">
            🏏 Put These Strategies to the Test — Play Free
          </Link>
          <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/rules" className="btn btn-outline btn-lg">
              📖 Read the Rules
            </Link>
            <Link to="/about" className="btn btn-outline btn-lg">
              ℹ️ About the Game
            </Link>
          </div>
        </section>
      </article>
    </div>
  );
}
