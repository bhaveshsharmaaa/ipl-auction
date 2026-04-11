import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { lobbyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getInitial } from '../utils/helpers';

export default function Dashboard() {
  const [lobbies, setLobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [lobbyName, setLobbyName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [bidTimer, setBidTimer] = useState(10);
  const [maxTeams, setMaxTeams] = useState(10);
  const [auctionType, setAuctionType] = useState('small');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [confirmPrompt, setConfirmPrompt] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchLobbies();
  }, []);

  const fetchLobbies = async () => {
    try {
      const res = await lobbyAPI.list();
      setLobbies(res.data);
    } catch (err) {
      console.error('Failed to fetch lobbies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await lobbyAPI.create({ 
        name: lobbyName, 
        isPublic,
        maxTeams,
        auctionType,
        settings: { bidTimer }
      });
      toast.success('Lobby created!');
      navigate(`/lobby/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create lobby');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoining(true);
    try {
      const res = await lobbyAPI.join(joinCode);
      toast.success('Joined lobby!');
      navigate(`/lobby/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join lobby');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>👋 Welcome, {user?.username}</h1>
          <p>Create a new auction lobby or join an existing one</p>
        </div>

        {/* Action Cards */}
        <div className="dashboard-grid">
          <div
            className="dashboard-action-card glass-card"
            onClick={() => setShowCreate(true)}
          >
            <div className="action-icon">🏟️</div>
            <h3>Create Lobby</h3>
            <p>Start a new IPL auction and invite friends</p>
          </div>

          <div
            className="dashboard-action-card glass-card"
            onClick={() => setShowJoin(true)}
          >
            <div className="action-icon">🔗</div>
            <h3>Join Lobby</h3>
            <p>Enter a lobby code to join an auction</p>
          </div>
        </div>

        {/* ── Live Auctions Section ── */}
        {(() => {
          const liveLobbies = lobbies.filter(l => l.status === 'in-progress');
          if (liveLobbies.length === 0) return null;
          return (
            <div className="lobbies-section" style={{ marginBottom: 32 }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ 
                  display: 'inline-block', width: 10, height: 10, borderRadius: '50%', 
                  background: 'var(--danger-500)', animation: 'pulse 1.5s infinite',
                  boxShadow: '0 0 8px var(--danger-500)'
                }} />
                Live Auctions
                <span className="badge" style={{ 
                  fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 'var(--radius-full)',
                  background: 'rgba(255,59,48,0.15)', color: 'var(--danger-400)', border: '1px solid rgba(255,59,48,0.3)'
                }}>{liveLobbies.length}</span>
              </h2>
              <div className="lobby-list">
                {liveLobbies.map(lobby => {
                  const abandonedCount = lobby.teams.filter(t => !t.user && !t.isAI).length;
                  const emptySlots = lobby.maxTeams - lobby.teams.length;
                  const vacantCount = abandonedCount + emptySlots;
                  const humanCount = lobby.teams.filter(t => t.user && !t.isAI).length;
                  const aiCount = lobby.teams.filter(t => t.isAI).length;
                  const isMyLobby = lobby.teams.some(t => (t.user?._id || t.user) === user?._id);

                  return (
                    <div key={lobby._id} className="lobby-item glass-card" style={{ 
                      borderLeft: '3px solid var(--danger-500)',
                      background: 'linear-gradient(135deg, rgba(255,59,48,0.05), transparent)'
                    }}>
                      <div className="lobby-info">
                        <div
                          className="avatar"
                          style={{ background: lobby.admin?.avatar || '#ff3b30' }}
                        >
                          {getInitial(lobby.admin?.username)}
                        </div>
                        <div>
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {lobby.name}
                            <span style={{ 
                              fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                              color: 'var(--danger-400)', letterSpacing: '1px', animation: 'pulse 2s infinite'
                            }}>● LIVE</span>
                          </h4>
                          <div className="lobby-meta">
                            <span>👥 {humanCount} Humans</span>
                            <span>🤖 {aiCount} Bots</span>
                            {vacantCount > 0 && (
                              <span style={{ color: 'var(--gold-400)', fontWeight: 800 }}>
                                ⌛ {vacantCount} Vacant {vacantCount === 1 ? 'Slot' : 'Slots'}
                              </span>
                            )}
                            <span>🏏 By {lobby.admin?.username}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {lobby.admin?._id === user?._id && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              setConfirmPrompt({
                                title: 'Delete Lobby?',
                                message: '🚨 Are you sure you want to delete this lobby completely? All configuration and teams will be lost. This cannot be undone.',
                                confirmText: 'Delete Forever',
                                confirmStyle: 'btn-danger',
                                onConfirm: async () => {
                                  try {
                                    await lobbyAPI.delete(lobby._id);
                                    fetchLobbies();
                                    toast.success('Lobby deleted');
                                  } catch (err) {
                                    toast.error('Failed to delete lobby');
                                  }
                                  setConfirmPrompt(null);
                                }
                              });
                            }}
                          >
                            Delete
                          </button>
                        )}
                        {isMyLobby ? (
                          <button
                            className="btn btn-gold btn-sm"
                            style={{ fontWeight: 900 }}
                            onClick={() => navigate(`/auction/${lobby._id}`)}
                          >
                            ⚡ Rejoin Auction
                          </button>
                        ) : vacantCount > 0 ? (
                          <button
                            className="btn btn-gold btn-sm"
                            style={{ fontWeight: 900 }}
                            onClick={async () => {
                              try {
                                await lobbyAPI.join(lobby.code);
                                toast.success('Joined Auction!');
                                navigate(`/lobby/${lobby._id}`);
                              } catch (err) {
                                toast.error(err.response?.data?.message || 'Failed to join');
                              }
                            }}
                          >
                            🏏 Join Auction
                          </button>
                        ) : (
                          <span className="badge" style={{ fontSize: 10, padding: '4px 10px', color: 'var(--text-tertiary)' }}>No Vacancies</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── Public Lobbies Section ── */}
        <div className="lobbies-section">
          <h2>🌐 Public Lobbies</h2>
          {(() => {
            const waitingLobbies = lobbies.filter(l => l.status === 'waiting');
            if (loading) {
              return <div className="page-loader"><div className="spinner"></div></div>;
            }
            if (waitingLobbies.length === 0) {
              return (
                <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    No public lobbies available. Create one to get started!
                  </p>
                </div>
              );
            }
            return (
              <div className="lobby-list">
                {waitingLobbies.map(lobby => (
                  <div key={lobby._id} className="lobby-item glass-card">
                    <div className="lobby-info">
                      <div
                        className="avatar"
                        style={{ background: lobby.admin?.avatar || '#7c2dff' }}
                      >
                        {getInitial(lobby.admin?.username)}
                      </div>
                      <div>
                        <h4>{lobby.name}</h4>
                        <div className="lobby-meta">
                          <span>👥 {lobby.teams.filter(t => t.user || t.isAI).length}/{lobby.maxTeams}</span>
                          <span>🏏 By {lobby.admin?.username}</span>
                          <span style={{
                            color: lobby.teams.filter(t => t.user || t.isAI).length < lobby.maxTeams ? 'var(--success-400)' : 'var(--danger-400)'
                          }}>
                            {lobby.teams.filter(t => t.user || t.isAI).length < lobby.maxTeams ? '● Open' : '● Full'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {lobby.admin?._id === user?._id && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            setConfirmPrompt({
                              title: 'Delete Lobby?',
                              message: '🚨 Are you sure you want to delete this lobby completely? All configuration and teams will be lost. This cannot be undone.',
                              confirmText: 'Delete Forever',
                              confirmStyle: 'btn-danger',
                              onConfirm: async () => {
                                try {
                                  await lobbyAPI.delete(lobby._id);
                                  fetchLobbies();
                                  toast.success('Lobby deleted');
                                } catch (err) {
                                  toast.error('Failed to delete lobby');
                                }
                                setConfirmPrompt(null);
                              }
                            });
                          }}
                        >
                          Delete
                        </button>
                      )}
                      {lobby.teams.some(t => (t.user?._id || t.user) === user?._id) && lobby.admin?._id !== user?._id && (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={async () => {
                            try {
                              await lobbyAPI.leave(lobby._id);
                              fetchLobbies();
                              toast.success('Left lobby');
                            } catch (err) {
                              toast.error('Failed to leave lobby');
                            }
                          }}
                        >
                          Leave
                        </button>
                      )}
                      {lobby.teams.some(t => (t.user?._id || t.user) === user?._id) ? (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => navigate(`/lobby/${lobby._id}`)}
                        >
                          Rejoin
                        </button>
                      ) : lobby.teams.length < lobby.maxTeams ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={async () => {
                            try {
                              await lobbyAPI.join(lobby.code);
                              toast.success('Joined lobby!');
                              navigate(`/lobby/${lobby._id}`);
                            } catch (err) {
                              toast.error(err.response?.data?.message || 'Failed to join');
                            }
                          }}
                        >
                          Join
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🏟️ Create Lobby</h2>
                <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
              </div>
              <form className="auth-form" onSubmit={handleCreate}>
                <div className="input-group">
                  <label>Lobby Name</label>
                  <input
                    className="input-field"
                    placeholder="My IPL Auction"
                    value={lobbyName}
                    onChange={e => setLobbyName(e.target.value)}
                    required
                    minLength={2}
                  />
                </div>

                <div className="input-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>⏱️ Bid Timer</span>
                    <span className="timer-value-badge">{bidTimer}s</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={bidTimer}
                    onChange={e => setBidTimer(parseInt(e.target.value))}
                    className="slider"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                    <span>⚡ 5s (Fast)</span>
                    <span>🐢 30s (Relaxed)</span>
                  </div>
                </div>

                <div className="input-group">
                  <label>Auction Type</label>
                  <div className="auction-type-grid">
                    {[
                      { id: 'small', label: 'Small', desc: '150 Players', icon: '🏏' },
                      { id: 'mini', label: 'Mini', desc: '300 Players', icon: '🏟️' },
                      { id: 'mega', label: 'Mega', desc: '500 Players', icon: '🏆' }
                    ].map(type => (
                      <div 
                        key={type.id}
                        className={`auction-type-card ${auctionType === type.id ? 'active' : ''}`}
                        onClick={() => setAuctionType(type.id)}
                      >
                        <div className="type-icon">{type.icon}</div>
                        <div className="type-info">
                          <span className="type-label">{type.label}</span>
                          <span className="type-desc">{type.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>👥 Max Teams</span>
                    <span className="timer-value-badge">{maxTeams}</span>
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="1"
                    value={maxTeams}
                    onChange={e => setMaxTeams(parseInt(e.target.value))}
                    className="slider"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                    <span>2 (Duels)</span>
                    <span>10 (Full IPL)</span>
                  </div>
                </div>

                <div className="input-group">
                  <label>Visibility</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${isPublic ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setIsPublic(true)}
                    >
                      🌐 Public
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${!isPublic ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setIsPublic(false)}
                    >
                      🔒 Private
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-gold btn-lg" disabled={creating}>
                  {creating ? <span className="spinner spinner-sm"></span> : 'Create Lobby'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Join Modal */}
        {showJoin && (
          <div className="modal-overlay" onClick={() => setShowJoin(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🔗 Join Lobby</h2>
                <button className="modal-close" onClick={() => setShowJoin(false)}>✕</button>
              </div>
              <form className="auth-form" onSubmit={handleJoin}>
                <div className="input-group">
                  <label>Lobby Code</label>
                  <input
                    className="input-field"
                    placeholder="Enter 6-character code"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    required
                    style={{ letterSpacing: '0.2em', textAlign: 'center', fontSize: '22px', fontWeight: 700 }}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={joining}>
                  {joining ? <span className="spinner spinner-sm"></span> : 'Join Lobby'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Universal Confirmation Modal */}
      {confirmPrompt && (
        <div className="squad-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="squad-modal-content" style={{ maxWidth: 400, textAlign: 'center', padding: '32px 24px', animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>{confirmPrompt.title}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14 }}>{confirmPrompt.message}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setConfirmPrompt(null)}>Cancel</button>
              <button className={`btn ${confirmPrompt.confirmStyle || 'btn-primary'}`} style={{ fontWeight: 800 }} onClick={confirmPrompt.onConfirm}>
                {confirmPrompt.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
