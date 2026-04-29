import { useState, useEffect, useCallback } from 'react';
import { playerAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatPrice, getRoleEmoji, getRoleColor, getTierBadgeClass, getInitial } from '../utils/helpers';

const PLAYERS_PER_PAGE = 30;

const TIER_COLORS = {
  Legend: { bg: 'rgba(255,215,0,0.12)', border: 'rgba(255,215,0,0.3)', text: '#ffd700' },
  Marquee: { bg: 'rgba(255,183,1,0.12)', border: 'rgba(255,183,1,0.3)', text: '#ffb701' },
  A: { bg: 'rgba(169,109,255,0.12)', border: 'rgba(169,109,255,0.3)', text: '#a96dff' },
  B: { bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)', text: '#60a5fa' },
  C: { bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)', text: '#4ade80' },
};

export default function Players() {
  const toast = useToast();
  const [players, setPlayers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [overseasFilter, setOverseasFilter] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchPlayers = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = { page: pageNum, limit: PLAYERS_PER_PAGE };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (tierFilter) params.tier = tierFilter;
      if (overseasFilter) params.overseas = overseasFilter;

      const res = await playerAPI.list(params);
      const { players: newPlayers, total: newTotal } = res.data;

      if (append) {
        setPlayers(prev => [...prev, ...newPlayers]);
      } else {
        setPlayers(newPlayers);
      }
      setTotal(newTotal);
      setPage(pageNum);
    } catch (err) {
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, roleFilter, tierFilter, overseasFilter]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchPlayers(1, false);
  }, [roleFilter, tierFilter, overseasFilter]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      fetchPlayers(1, false);
    }, 300);
    setSearchTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleShowMore = () => {
    fetchPlayers(page + 1, true);
  };

  const hasMore = players.length < total;

  const PlayerImage = ({ player, size = 56 }) => {
    const [imgError, setImgError] = useState(false);
    
    if (!player.image || imgError) {
      return (
        <div
          style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${getRoleColor(player.role)}33, ${getRoleColor(player.role)}66)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.4, fontWeight: 800, color: getRoleColor(player.role),
            border: `2px solid ${getRoleColor(player.role)}44`
          }}
        >
          {getInitial(player.name)}
        </div>
      );
    }

    return (
      <img
        src={player.image}
        alt={player.name}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover',
          flexShrink: 0, border: `2px solid ${getRoleColor(player.role)}44`,
          background: 'var(--bg-glass)'
        }}
      />
    );
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 1100 }}>
        {/* Header */}
        <div className="page-header" style={{ marginBottom: 24 }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            🏏 <span>Player Database</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-tertiary)', background: 'var(--bg-glass)', padding: '4px 12px', borderRadius: 'var(--radius-full)' }}>
              {total} players
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Browse all IPL players, view their stats, and discover hidden gems for your auction strategy.</p>
        </div>

        {/* Filters Bar */}
        <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.5 }}>🔍</span>
            <input
              type="text"
              placeholder="Search players by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 36px',
                background: 'var(--bg-glass)', border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                fontSize: 14, outline: 'none'
              }}
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '10px 14px', background: 'var(--bg-glass)',
              border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', outline: 'none'
            }}
          >
            <option value="">All Roles</option>
            <option value="Batsman">🏏 Batsman</option>
            <option value="Bowler">☄️ Bowler</option>
            <option value="All-Rounder">⭐ All-Rounder</option>
            <option value="Wicketkeeper">🧤 Wicketkeeper</option>
          </select>

          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            style={{
              padding: '10px 14px', background: 'var(--bg-glass)',
              border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', outline: 'none'
            }}
          >
            <option value="">All Tiers</option>
            <option value="Legend">👑 Legend</option>
            <option value="Marquee">⭐ Marquee</option>
            <option value="A">A Tier</option>
            <option value="B">B Tier</option>
            <option value="C">C Tier</option>
          </select>

          {/* Overseas Filter */}
          <select
            value={overseasFilter}
            onChange={(e) => setOverseasFilter(e.target.value)}
            style={{
              padding: '10px 14px', background: 'var(--bg-glass)',
              border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', outline: 'none'
            }}
          >
            <option value="">All Players</option>
            <option value="false">🇮🇳 Indian</option>
            <option value="true">🌍 Overseas</option>
          </select>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="page-loader"><div className="spinner"></div></div>
        ) : players.length === 0 ? (
          <div className="glass-card" style={{ padding: '64px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3>No players found</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            {/* Player Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {players.map(player => {
                const tierColor = TIER_COLORS[player.tier] || TIER_COLORS.C;
                return (
                  <div
                    key={player._id}
                    className="glass-card"
                    onClick={() => setSelectedPlayer(player)}
                    style={{
                      padding: '16px 18px', cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      border: `1px solid ${tierColor.border}`,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 8px 30px ${tierColor.bg}`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <PlayerImage player={player} size={52} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {player.name}
                          </span>
                          {player.isOverseas && <span title={player.nationality} style={{ fontSize: 12 }}>🌍</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                            background: tierColor.bg, color: tierColor.text, border: `1px solid ${tierColor.border}`,
                            textTransform: 'uppercase', letterSpacing: '0.5px'
                          }}>
                            {player.tier}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                            background: `${getRoleColor(player.role)}15`, color: getRoleColor(player.role),
                          }}>
                            {getRoleEmoji(player.role)} {player.role}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto', fontWeight: 700 }}>
                            {formatPrice(player.basePrice)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats Row */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{player.stats?.matches || 0}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Matches</div>
                      </div>
                      {(player.role !== 'Bowler') && (
                        <>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#60a5fa' }}>{player.stats?.runs || 0}</div>
                            <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Runs</div>
                          </div>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24' }}>{player.stats?.strikeRate?.toFixed(1) || '0.0'}</div>
                            <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>SR</div>
                          </div>
                        </>
                      )}
                      {(player.role !== 'Batsman' && player.role !== 'Wicketkeeper') && (
                        <>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#f87171' }}>{player.stats?.wickets || 0}</div>
                            <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Wkts</div>
                          </div>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#4ade80' }}>{player.stats?.economy?.toFixed(1) || '0.0'}</div>
                            <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Econ</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show More Button */}
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleShowMore}
                  disabled={loadingMore}
                  style={{ minWidth: 220, fontSize: 15, fontWeight: 800 }}
                >
                  {loadingMore ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                      <div className="spinner" style={{ width: 18, height: 18 }}></div>
                      Loading...
                    </span>
                  ) : (
                    `Show More Players (${players.length} / ${total})`
                  )}
                </button>
              </div>
            )}

            {/* Loaded Count */}
            {!hasMore && players.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-tertiary)', fontSize: 13 }}>
                Showing all {total} players
              </div>
            )}
          </>
        )}

        {/* Player Detail Modal */}
        {selectedPlayer && (
          <div
            className="squad-modal-overlay"
            onClick={(e) => e.target === e.currentTarget && setSelectedPlayer(null)}
            style={{ zIndex: 10000 }}
          >
            <div className="squad-modal-content" style={{ maxWidth: 520, padding: 0, overflow: 'hidden' }}>
              {/* Modal Header with gradient */}
              <div style={{
                padding: '32px 28px 24px',
                background: `linear-gradient(135deg, ${getRoleColor(selectedPlayer.role)}22, transparent)`,
                borderBottom: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <PlayerImage player={selectedPlayer} size={72} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{selectedPlayer.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className={`badge ${getTierBadgeClass(selectedPlayer.tier)}`} style={{ fontSize: 11 }}>
                        {selectedPlayer.tier}
                      </span>
                      <span style={{ fontSize: 12, color: getRoleColor(selectedPlayer.role), fontWeight: 700 }}>
                        {getRoleEmoji(selectedPlayer.role)} {selectedPlayer.role}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {selectedPlayer.isOverseas ? `🌍 ${selectedPlayer.nationality}` : '🇮🇳 India'}
                      </span>
                    </div>
                    {selectedPlayer.specialization && (
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6, fontStyle: 'italic' }}>
                        {selectedPlayer.specialization}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ padding: '20px 28px 8px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary-300)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 14 }}>
                  Career Statistics
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { label: 'Matches', value: selectedPlayer.stats?.matches || 0, color: '#fff' },
                    { label: 'Runs', value: selectedPlayer.stats?.runs || 0, color: '#60a5fa' },
                    { label: 'Bat Avg', value: selectedPlayer.stats?.battingAvg?.toFixed(1) || '0.0', color: '#fbbf24' },
                    { label: 'Strike Rate', value: selectedPlayer.stats?.strikeRate?.toFixed(1) || '0.0', color: '#fb923c' },
                    { label: 'Fifties', value: selectedPlayer.stats?.fifties || 0, color: '#a78bfa' },
                    { label: 'Hundreds', value: selectedPlayer.stats?.hundreds || 0, color: '#f472b6' },
                    { label: 'Wickets', value: selectedPlayer.stats?.wickets || 0, color: '#f87171' },
                    { label: 'Bowl Avg', value: selectedPlayer.stats?.bowlingAvg?.toFixed(1) || '0.0', color: '#4ade80' },
                    { label: 'Economy', value: selectedPlayer.stats?.economy?.toFixed(1) || '0.0', color: '#38bdf8' },
                    { label: 'Catches', value: selectedPlayer.stats?.catches || 0, color: '#d4d4d8' },
                    { label: 'Base Price', value: formatPrice(selectedPlayer.basePrice), color: '#fbbf24' },
                  ].map((stat, i) => (
                    <div key={i} style={{
                      padding: '12px 10px', textAlign: 'center',
                      background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.04)'
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <div style={{ padding: '16px 28px 24px', textAlign: 'center' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setSelectedPlayer(null)}
                  style={{ width: '100%', fontWeight: 700 }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
