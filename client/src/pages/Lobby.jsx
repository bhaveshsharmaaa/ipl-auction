import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lobbyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { getInitial, TEAM_COLORS } from '../utils/helpers';
import { IPL_FRANCHISES } from '../constants/franchises';

export default function Lobby() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();

  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [confirmPrompt, setConfirmPrompt] = useState(null);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const chatEndRef = useRef(null);


  // Fetch lobby data
  useEffect(() => {
    fetchLobby();
  }, [id]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('lobby:join', { lobbyId: id });

    const handleReconnect = () => {
      socket.emit('lobby:join', { lobbyId: id });
    };
    socket.on('connect', handleReconnect);

    socket.on('lobby:updated', (updatedLobby) => {
      setLobby(updatedLobby);
    });

    socket.on('chat:message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('auction:started', ({ lobby: updatedLobby }) => {
      toast.info('🏏 Auction is starting!');
      navigate(`/auction/${id}`);
    });

    socket.on('lobby:deleted', () => {
      setIsDestroyed(true);
    });

    socket.on('lobby:claimed', () => {
      toast.success('Successfully claimed team! Joining auction...');
      navigate(`/auction/${id}`);
    });

    socket.on('error', ({ message }) => {
      toast.error(message);
    });

    return () => {
      socket.emit('lobby:leave', { lobbyId: id });
      socket.off('connect', handleReconnect);
      socket.off('lobby:updated');
      socket.off('chat:message');
      socket.off('auction:started');
      socket.off('lobby:deleted');
      socket.off('lobby:claimed');
      socket.off('error');
    };
  }, [socket, id]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchLobby = async () => {
    try {
      const res = await lobbyAPI.get(id);
      setLobby(res.data);
      if (res.data.messages) {
        setMessages(res.data.messages);
      }
      // If auction is in progress, redirect
      if (res.data.status === 'in-progress') {
        // Only redirect to auction if user already has a team
        const hasTeam = res.data.teams.some(t => (t.user?._id || t.user) === user?._id);
        if (hasTeam) {
          navigate(`/auction/${id}`);
        }
      } else if (res.data.status === 'completed') {
        navigate(`/results/${id}`);
      }
    } catch (err) {
      toast.error('Lobby not found');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };



  const handleStart = () => {
    const humanCount = lobby.teams.filter(t => t.user && !t.isAI).length;
    if (lobby.teams.length < 2) {
      toast.error('Need at least 2 teams to start');
      return;
    }
    if (humanCount < 1) {
      toast.error('Need at least 1 human player to start');
      return;
    }
    socket?.emit('auction:start', { lobbyId: id });
  };

  const handleLeave = () => {
    setConfirmPrompt({
      title: 'Exit Lobby?',
      message: 'Are you sure you want to exit this draft lobby? You may not be able to rejoin if it gets full.',
      confirmText: 'Yes, Exit',
      confirmStyle: 'btn-danger',
      onConfirm: async () => {
        try {
          await lobbyAPI.leave(id);
          toast.info('Left the lobby');
          navigate('/dashboard');
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to leave');
        }
        setConfirmPrompt(null);
      }
    });
  };

  const handleToggleAI = () => {
    const hasAI = lobby.teams.some(t => t.isAI);
    if (hasAI) {
      socket?.emit('lobby:removeAI', { lobbyId: id });
    } else {
      socket?.emit('lobby:fillAI', { lobbyId: id });
    }
  };

  const handleDeleteLobby = () => {
    setConfirmPrompt({
      title: 'Delete Lobby?',
      message: '🚨 Are you sure you want to delete this lobby completely? All configuration and teams will be lost. This cannot be undone.',
      confirmText: 'Delete Forever',
      confirmStyle: 'btn-danger',
      onConfirm: () => {
        socket?.emit('lobby:delete', { lobbyId: id });
        toast.success('Lobby deleted successfully');
        navigate('/dashboard');
        setConfirmPrompt(null);
      }
    });
  };


  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket?.emit('chat:message', { lobbyId: id, text: chatInput.trim() });
    setChatInput('');
  };

  const handleTeamUpdate = (franchiseName) => {
    if (lobby.status === 'in-progress') {
      const vacantTeam = lobby.teams.find(t => t.teamName === franchiseName && !t.user && !t.isAI);
      if (vacantTeam) {
        socket?.emit('lobby:claimTeam', { lobbyId: id, teamId: vacantTeam._id });
      } else if (lobby.teams.length < lobby.maxTeams) {
        socket?.emit('lobby:joinMidAuctionAsNew', { lobbyId: id, teamName: franchiseName });
      } else {
        toast.error('This team is not available for claiming');
      }
    } else {
      socket?.emit('lobby:teamUpdate', { 
        lobbyId: id, 
        teamName: franchiseName
      });
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(lobby.code);
    toast.success('Lobby code copied!');
  };

  const [previewFranchise, setPreviewFranchise] = useState(null);

  const isAdmin = lobby?.admin?._id === user?._id;
  const myTeam = lobby?.teams?.find(t =>
    (t.user?._id || t.user) === user?._id
  );

  useEffect(() => {
    if (myTeam && !previewFranchise) {
      setPreviewFranchise(myTeam.teamName);
    }
  }, [myTeam, previewFranchise]);

  if (loading) {
    return <div className="page-loader"><div className="spinner"></div></div>;
  }

  if (!lobby) return null;

  const currentPreview = IPL_FRANCHISES.find(f => f.name === (previewFranchise || myTeam?.teamName || 'CSK'));

  return (
    <>
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

      {/* Lobby Destruction Modal */}
      {isDestroyed && (
        <div className="squad-modal-overlay" style={{ zIndex: 10000, background: 'rgba(0,0,0,0.9)' }}>
          <div className="squad-modal-content" style={{ maxWidth: 450, textAlign: 'center', padding: '48px 32px', border: '1px solid var(--danger-500)' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🚨</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16, color: 'var(--danger-400)' }}>Lobby Closed</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 16, lineHeight: 1.6 }}>
              The admin has deleted this lobby. Any active draft or auction has been terminated.
            </p>
            <button 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%', fontWeight: 800 }}
              onClick={() => navigate('/dashboard')}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
      <div className="auction-viewport">
        <div className="lobby-draft-container" style={{ height: '100vh', border: 'none', borderRadius: 0 }}>
        {/* Left Sidebar - Franchise Selection */}
        <div className="draft-sidebar">
          <div className="draft-sidebar-header" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '12px', color: 'var(--primary-400)', fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.8 }}>DRAFT ROOM</h2>
            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-1px', margin: 0 }}>Select Franchise</h1>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success-500)', boxShadow: '0 0 10px var(--success-500)' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-tertiary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {lobby.teams.length} {"/"} {lobby.maxTeams} Franchises Joined
            </span>
          </div>
          {lobby.auctionType && (
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                background: lobby.auctionType === 'mega' ? 'rgba(255,215,0,0.15)' : lobby.auctionType === 'small' ? 'rgba(76,175,80,0.15)' : 'rgba(124,45,255,0.15)',
                color: lobby.auctionType === 'mega' ? 'var(--gold-400)' : lobby.auctionType === 'small' ? 'var(--success-400)' : 'var(--primary-400)',
                border: `1px solid ${lobby.auctionType === 'mega' ? 'rgba(255,215,0,0.3)' : lobby.auctionType === 'small' ? 'rgba(76,175,80,0.3)' : 'rgba(124,45,255,0.3)'}`,
                textTransform: 'uppercase', letterSpacing: '1px'
              }}>
                {lobby.auctionType === 'mega' ? '🏆 MEGA AUCTION' : lobby.auctionType === 'small' ? '🏏 SMALL AUCTION' : '🏟️ MINI AUCTION'}
              </span>
            </div>
          )}
        </div>

        <div className="draft-team-list">
              {IPL_FRANCHISES.map((f, index) => {
                const teamData = lobby.teams.find(t => t.teamName === f.name);
                const isActive = (previewFranchise || myTeam?.teamName) === f.name;
                const isMine = teamData && (teamData.user?._id || teamData.user) === user?._id;
                
                // Clickable logic: 
                // 1. In waiting: always clickable
                // 2. In progress: always clickable for preview (the REPRESENT button only appears for vacant teams)
                const isOccupied = teamData && (teamData.user != null || teamData.isAI);
                const isClickable = true;

                return (
                  <div 
                    key={f.name}
                    className={`draft-list-item ${isActive ? 'active' : ''} ${!isClickable ? 'disabled' : ''}`}
                    onClick={() => isClickable && setPreviewFranchise(f.name)}
                    style={{ 
                      '--team-color': f.color,
                      '--team-color-glow': `${f.color}60`,
                      '--team-text-active': f.btnTextColor || '#000',
                      opacity: !isClickable && !isActive ? 0.4 : 1,
                      cursor: isClickable ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <div className="item-index">{(index + 1).toString().padStart(2, '0')}</div>
                    {f.logo ? (
                      <img src={f.logo} alt={f.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                    ) : (
                      <div className="avatar avatar-sm" style={{ background: f.color, color: '#000' }}>{getInitial(f.name)}</div>
                    )}
                    <div className="draft-list-item-content">

                      <div className="item-name">{f.name}</div>
                      <div className="item-status">
                        {teamData ? (teamData.isAI ? 'AI System' : (teamData.user?.username || (teamData.user === null ? 'Vacant' : 'Occupied'))) : 'Available'}
                      </div>
                    </div>
                    {isMine && <span style={{ fontSize: 10, color: '#77ab59', fontWeight: 900 }}>MINE</span>}
                    {lobby.status === 'in-progress' && teamData && !isOccupied && (
                      <span className="badge badge-gold" style={{ fontSize: 8, padding: '2px 4px' }}>VACANT</span>
                    )}

                  </div>
                );
              })}
            </div>

            <div className="draft-sidebar-footer">
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Access Code</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <code style={{ fontSize: 20, color: 'var(--primary-300)', fontWeight: 800 }}>{lobby.code}</code>
                  <button className="btn btn-outline btn-xs" onClick={copyCode}>Copy</button>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {isAdmin && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button className="btn btn-gold" onClick={handleStart} disabled={lobby.teams.length < 2} style={{ height: 50, fontWeight: 900, fontSize: 16 }}>
                      🚀 START AUCTION
                    </button>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <button 
                        className={`btn ${lobby.teams.some(t => t.isAI) ? 'btn-danger' : 'btn-outline'}`}
                        onClick={handleToggleAI}
                        style={{ height: 45, fontWeight: 700 }}
                      >
                        {lobby.teams.some(t => t.isAI) ? '🚫 Remove AI' : '🤖 Fill with AI'}
                      </button>
                      
                      <button 
                        className="btn btn-outline"
                        style={{ height: 45, fontWeight: 700, color: 'var(--danger-400)', borderColor: 'var(--danger-400)' }}
                        onClick={handleDeleteLobby}
                      >
                        🗑️ Delete Lobby
                      </button>
                    </div>
                  </div>
                )}
                <button className="btn btn-danger btn-sm" onClick={handleLeave}>Exit Lobby</button>
              </div>
            </div>
          </div>

          {/* Main Showcase Area */}
          <div 
            className="draft-showcase"
            style={{ 
              '--team-color': currentPreview.color,
              '--team-color-glow': `${currentPreview.color}60`
            }}
          >
            <div className="team-logo-shield">
              <img 
                src={currentPreview.logo} 
                alt={currentPreview.name} 
                style={{ 
                  width: '80%', 
                  height: '80%', 
                  objectFit: 'contain', 
                  filter: 'drop-shadow(0 0 30px var(--team-color-glow))' 
                }} 
              />
            </div>

            <div className="showcase-mesh" />
            <div className="showcase-overlay" />
            
            <div className="showcase-content">
              <div className="showcase-tagline" style={{ color: currentPreview.btnTextColor || '#fff' }}>
                Elite Franchise Selection
              </div>
              <h1 className="showcase-team-name">{currentPreview.fullName}</h1>
              
              <div className="showcase-action-zone">
                {(() => {
                  const teamData = lobby.teams.find(t => t.teamName === currentPreview.name);
                  const isMine = teamData && (teamData.user?._id || teamData.user) === user?._id;
                  const isAvailable = !teamData;

                  if (isMine) {
                    return (
                      <div className="showcase-player-card">
                        <div className="avatar" style={{ width: 80, height: 80, background: currentPreview.color, color: '#000', fontSize: 32, fontWeight: 900 }}>
                          {getInitial(user?.username || 'U')}
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'white', textTransform: 'uppercase' }}>Current Leader</div>
                          <div style={{ fontSize: 32, fontWeight: 900, margin: '4px 0' }}>{user?.username}</div>
                        </div>
                      </div>
                    );
                  }

                  const isVacant = teamData && teamData.user == null && !teamData.isAI;
                  
                  // In waiting: any available franchise can be selected
                  if (lobby.status === 'waiting' && (isAvailable || isVacant)) {
                    return (
                      <button 
                        className="giant-claim-btn" 
                        onClick={() => handleTeamUpdate(currentPreview.name)}
                        style={{ color: currentPreview.btnTextColor || 'inherit' }}
                      >
                        REPRESENT {currentPreview.name}
                      </button>
                    );
                  }

                  // In progress: existing vacant teams OR new teams if under maxTeams limit
                  if (lobby.status === 'in-progress') {
                    if (isVacant || (isAvailable && lobby.teams.length < lobby.maxTeams)) {
                      return (
                        <button 
                          className="giant-claim-btn" 
                          onClick={() => handleTeamUpdate(currentPreview.name)}
                          style={{ color: currentPreview.btnTextColor || 'inherit' }}
                        >
                          REPRESENT & JOIN AUCTION
                        </button>
                      );
                    }
                    
                    if (isAvailable) {
                      return (
                        <div style={{ textAlign: 'center', padding: '24px 32px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--glass-border)' }}>
                          <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
                          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Not Available</div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                            The auction is full. You can only claim teams marked as <strong style={{ color: 'var(--gold-400)' }}>VACANT</strong>.
                          </div>
                        </div>
                      );
                    }
                  }

                  return (
                    <div className="showcase-player-card" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="avatar" style={{ width: 80, height: 80, background: currentPreview.color, fontSize: 32 }}>
                        {getInitial(teamData.isAI ? teamData.teamName : (teamData.user?.username || 'P'))}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'white', textTransform: 'uppercase' }}>Franchise Owner</div>
                        <div style={{ fontSize: 32, fontWeight: 900 }}>
                          {teamData.isAI ? '🤖 AI Systems' : teamData.user?.username}
                        </div>
                      </div>
                    </div>
                  );
                })()}
        </div> {/* showcase-action-zone shadow closure */}
      </div> {/* showcase-content */}
    </div> {/* draft-showcase */}
  </div> {/* lobby-draft-container */}
</div> {/* auction-viewport */}
</>
  );
}
