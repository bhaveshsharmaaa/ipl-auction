import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auctionAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatPrice, getInitial, getRoleEmoji, TEAM_COLORS } from '../utils/helpers';
import { IPL_FRANCHISES } from '../constants/franchises';


const BREAKDOWN_COLORS = {
  starPower: '#a96dff',
  squadBalance: '#4ade80',
  overseasMix: '#60a5fa',
  budgetEfficiency: '#fbbf24',
  battingStrength: '#f87171',
  bowlingStrength: '#38bdf8',
};

const BREAKDOWN_LABELS = {
  starPower: 'Star Power',
  squadBalance: 'Squad Balance',
  overseasMix: 'Overseas Mix',
  budgetEfficiency: 'Budget Efficiency',
  battingStrength: 'Batting',
  bowlingStrength: 'Bowling',
};

export default function Results() {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
    try {
      const res = await auctionAPI.getResults(id);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-loader"><div className="spinner"></div></div>;
  }

  if (!data) {
    return (
      <div className="page" style={{ textAlign: 'center', padding: 64 }}>
        <h2>Results not available</h2>
        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: 24 }}>Back to Dashboard</Link>
      </div>
    );
  }

  const { evaluation, lobby } = data;
  const { rankings, bestTeam, averageScore } = evaluation;

  return (
    <div className="page">
      <div className="results-page container">
        {/* Header */}
        <div className="results-header">
          <h1>🏆 Auction Results</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
            {lobby.name} — {rankings.length} teams competed
          </p>
        </div>

        {/* Winner Card */}
        {bestTeam && (
          <div className="winner-card glass-card">
            <div className="trophy">🏆</div>
            <div style={{ position: 'relative', height: 120, margin: '20px 0', display: 'flex', alignItems: 'center', justifyAlignment: 'center', justifyContent: 'center' }}>
               {(() => {
                  const franchise = IPL_FRANCHISES.find(f => f.name === bestTeam.teamName);
                  return franchise?.logo && (
                    <img src={franchise.logo} alt={bestTeam.teamName} style={{ height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(255,209,26,0.5))' }} />
                  );
               })()}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Best Franchise Award
            </div>
            <div className="winner-name">{bestTeam.teamName}</div>

            <div style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
              by {bestTeam.username}
            </div>
            <div className="winner-score">{bestTeam.totalScore}/100</div>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{bestTeam.playerCount}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Players</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{formatPrice(bestTeam.budgetSpent)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Spent</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{formatPrice(bestTeam.budgetRemaining)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Remaining</div>
              </div>
            </div>
          </div>
        )}

        {/* Score Breakdown Legend */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', fontSize: 12 }}>
            {Object.entries(BREAKDOWN_LABELS).map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: BREAKDOWN_COLORS[key], display: 'inline-block' }} />
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rankings */}
        <div className="rankings-grid">
          {rankings.map((team, i) => {
            const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
            const isExpanded = expandedTeam === team.userId;

            return (
              <div key={team.userId}>
                <div
                  className="ranking-card glass-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setExpandedTeam(isExpanded ? null : team.userId)}
                >
                  <div className={`rank ${rankClass}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${team.rank}`}
                  </div>

                  <div className="team-info">
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {(() => {
                        const franchise = IPL_FRANCHISES.find(f => f.name === team.teamName);
                        return franchise?.logo ? (
                          <img src={franchise.logo} alt={team.teamName} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                        ) : (
                          <span
                            className="avatar avatar-sm"
                            style={{ background: TEAM_COLORS[i % TEAM_COLORS.length], width: 28, height: 28, fontSize: 11 }}
                          >
                            {getInitial(team.username)}
                          </span>
                        );
                      })()}
                      {team.teamName}
                    </h4>

                    <div className="team-meta">
                      {team.username} • {team.playerCount} players • Spent {formatPrice(team.budgetSpent)}
                    </div>
                  </div>

                  <div className="team-score">{team.totalScore}</div>

                  <div className="score-breakdown-col">
                    <div className="score-breakdown">
                      {Object.entries(team.breakdown).map(([key, val]) => (
                        <div
                          key={key}
                          className="segment"
                          style={{
                            background: BREAKDOWN_COLORS[key],
                            width: `${(val.score / 100) * 100}%`,
                            minWidth: val.score > 0 ? 4 : 0
                          }}
                          title={`${BREAKDOWN_LABELS[key]}: ${val.score}/${val.max}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expanded breakdown */}
                {isExpanded && (
                  <div className="glass-card" style={{ padding: 20, marginTop: -4, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                      {Object.entries(team.breakdown).map(([key, val]) => (
                        <div key={key} style={{ padding: 12, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: BREAKDOWN_COLORS[key] }}>
                            {val.score}/{val.max}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                            {BREAKDOWN_LABELS[key]}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary-300)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>🏏 Best Playing XI</span>
                        {team.bestXI && team.bestXI.length > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', padding: '2px 8px', borderRadius: 10, letterSpacing: '0.5px' }}>
                            🌍 {team.bestXI.filter(p => p.isOverseas).length}/4 Overseas
                          </span>
                        )}
                        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--primary-500), transparent)', opacity: 0.3 }} />
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 6 }}>
                        {team.bestXI && team.bestXI.length > 0 ? (
                          team.bestXI.map((player, idx) => (
                            <div key={idx} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                               <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-tertiary)', width: 22, textAlign: 'center', flexShrink: 0, opacity: 0.6 }}>#{idx + 1}</span>
                               <span style={{ fontSize: 16, flexShrink: 0 }}>{getRoleEmoji(player.role)}</span>
                               <div style={{ flex: 1, minWidth: 0 }}>
                                 <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                   {player.name}
                                   {player.isOverseas && <span title="Overseas" style={{ fontSize: 10, marginLeft: 4 }}>🌍</span>}
                                 </div>
                                 <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                   {player.role}{player.specialization ? ` • ${player.specialization}` : ''}
                                 </div>
                               </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Squad incomplete or empty</div>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      🌍 Overseas in Squad: {team.overseasCount} • 💰 Remaining: {formatPrice(team.budgetRemaining)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Average Score */}
        <div className="glass-card" style={{ padding: 24, textAlign: 'center', marginTop: 24 }}>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Average Team Score</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 36, fontWeight: 800, color: 'var(--primary-300)' }}>
            {averageScore}/100
          </div>
        </div>

        {/* Back */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/dashboard" className="btn btn-primary btn-lg">← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
