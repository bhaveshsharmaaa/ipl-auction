import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lobbyAPI, auctionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, getInitial, getRoleEmoji, getTierBadgeClass, TEAM_COLORS } from '../utils/helpers';
import { IPL_FRANCHISES } from '../constants/franchises';


export default function Auction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();

  const [lobby, setLobby] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [currentBidder, setCurrentBidder] = useState(null);
  const [bidderTeamName, setBidderTeamName] = useState('');
  const [bidHistory, setBidHistory] = useState([]);
  const [timer, setTimer] = useState(10);
  const [timerDuration, setTimerDuration] = useState(10);
  const [showSold, setShowSold] = useState(null); // { type: 'sold'|'unsold', player, buyer, price }
  const [isPaused, setIsPaused] = useState(false);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nextBidAmount, setNextBidAmount] = useState(0);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [playerPool, setPlayerPool] = useState([]);
  const [soldPlayers, setSoldPlayers] = useState([]);
  const [unsoldPlayers, setUnsoldPlayers] = useState([]);
  const [selectedSquadTeam, setSelectedSquadTeam] = useState(null);
  const [showPlayerIntro, setShowPlayerIntro] = useState(false);
  const [confirmPrompt, setConfirmPrompt] = useState(null);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [pauseNotification, setPauseNotification] = useState(null);



  const timerRef = useRef(null);
  const timerEndRef = useRef(null);

  // Initialize
  useEffect(() => {
    initAuction();
  }, [id]);

  // Socket events
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('lobby:join', { lobbyId: id });


    socket.on('auction:newPlayer', ({ player, index, total }) => {
      setCurrentPlayer(player);
      setCurrentBid(0);
      setCurrentBidder(null);
      setBidderTeamName('');
      setBidHistory([]);
      setPlayerIndex(index);
      setTotalPlayers(total);
      setShowSold(null);
      setNextBidAmount(player.basePrice);
      setShowPlayerIntro(true); // Show intro modal for next player
    });


    socket.on('auction:bidUpdate', ({ bidder, bidderTeamName: teamName, bidderTeamColor, amount, nextBid, player }) => {
      setCurrentBid(amount);
      setCurrentBidder(bidder);
      setBidderTeamName(teamName);
      setNextBidAmount(nextBid);
      setBidHistory(prev => [{ user: bidder._id, username: bidder.username, amount, timestamp: new Date() }, ...prev]);
    });

    socket.on('auction:timerStart', ({ duration, timerEnd }) => {
      setTimerDuration(duration);
      timerEndRef.current = new Date(timerEnd);
      startTimerCountdown();
      setShowPlayerIntro(false); // Hide intro when bidding starts
    });


    socket.on('auction:playerSold', ({ player, buyer, price }) => {
      setShowSold({ type: 'sold', player, buyer, price });
      setSoldPlayers(prev => [...prev.filter(p => p.player?._id !== player._id && p.player !== player._id), { player, buyer, price }]);
      clearTimerInterval();
    });

    socket.on('auction:playerUnsold', ({ player }) => {
      setShowSold({ type: 'unsold', player });
      setUnsoldPlayers(prev => [...prev.filter(p => (p._id || p) !== (player._id || player)), player]);
      clearTimerInterval();
    });

    socket.on('auction:paused', () => {
      setIsPaused(true);
      setPauseNotification('⏸ AUCTION PAUSED BY ADMIN');
      setTimeout(() => setPauseNotification(null), 2000);
      clearTimerInterval();
    });

    socket.on('auction:resumed', () => {
      setIsPaused(false);
      setPauseNotification('▶ AUCTION RESUMED');
      setTimeout(() => setPauseNotification(null), 2000);
    });

    socket.on('auction:completed', () => {
      toast.success('🏆 Auction completed!');
      setTimeout(() => navigate(`/results/${id}`), 2000);
    });

    socket.on('auction:timerUpdated', ({ duration }) => {
      setTimerDuration(duration);
    });
    
    socket.on('lobby:deleted', () => {
      setIsDestroyed(true);
    });

    socket.on('lobby:updated', (updatedLobby) => {
      // Check for Admin Promotion
      const currentUserId = user?._id || user;
      const wasAdmin = (lobby?.admin?._id || lobby?.admin) === currentUserId;
      const isNowAdmin = (updatedLobby.admin?._id || updatedLobby.admin) === currentUserId;

      if (lobby && !wasAdmin && isNowAdmin) {
        setShowAdminModal(true);
      }
      setLobby(updatedLobby);
    });

    return () => {
      socket.off('lobby:updated');
      socket.off('auction:newPlayer');
      socket.off('auction:bidUpdate');
      socket.off('auction:timerStart');
      socket.off('auction:playerSold');
      socket.off('auction:playerUnsold');
      socket.off('auction:paused');
      socket.off('auction:resumed');
      socket.off('auction:completed');
      socket.off('auction:timerUpdated');
      socket.off('lobby:deleted');
      socket.off('error');
      clearTimerInterval();
    };
  }, [socket, id]);

  const initAuction = async () => {
    try {
      const [lobbyRes, auctionRes] = await Promise.all([
        lobbyAPI.get(id),
        auctionAPI.getState(id)
      ]);

      setLobby(lobbyRes.data);
      const auction = auctionRes.data;

      if (auction.currentPlayer) {
        setCurrentPlayer(auction.currentPlayer);
        setCurrentBid(auction.currentBid || 0);
        setPlayerIndex(auction.currentPlayerIndex || 0);
        setTotalPlayers(auction.playerPool?.length || 0);
        setPlayerPool(auction.playerPool || []);
        setSoldPlayers(auction.soldPlayers || []);
        setUnsoldPlayers(auction.unsoldPlayers || []);

        if (auction.currentBid > 0) {
          setNextBidAmount(auction.currentBid + getIncrement(auction.currentBid));
        } else {
          setNextBidAmount(auction.currentPlayer.basePrice);
        }
      }

      if (auction.status === 'completed') {
        navigate(`/results/${id}`);
      }
      if (auction.status === 'paused') {
        setIsPaused(true);
      }

      // REDIRECTION GUARD: If user has no team during an active auction, redirect to Lobby selection
      // But only if the lobby is still in-progress (not completed/waiting)
      const hasTeam = lobbyRes.data.teams.some(t => 
        t.user && ((t.user._id || t.user) === user?._id)
      );
      if (!hasTeam && lobbyRes.data.status === 'in-progress') {
        // Check if there are any vacant teams they can claim
        const hasVacant = lobbyRes.data.teams.some(t => !t.user && !t.isAI);
        if (hasVacant) {
          toast.info('Please select a vacant team to join the auction');
          navigate(`/lobby/${id}`);
        }
      }
    } catch (err) {
      toast.error('Failed to load auction');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  function getIncrement(bid) {
    if (bid < 100) return 5;
    if (bid < 200) return 10;
    if (bid < 500) return 20;
    if (bid < 1000) return 25;
    return 50;
  }

  function startTimerCountdown() {
    clearTimerInterval();
    timerRef.current = setInterval(() => {
      if (!timerEndRef.current) return;
      const remaining = Math.max(0, (timerEndRef.current - Date.now()) / 1000);
      setTimer(remaining);
      if (remaining <= 0) {
        clearTimerInterval();
      }
    }, 100);
  }

  function clearTimerInterval() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  const handleBid = useCallback(() => {
    if (!socket || !id) return;
    socket.emit('auction:bid', { lobbyId: id });
  }, [socket, id]);

  const handlePause = () => socket?.emit('auction:pause', { lobbyId: id });
  const handleResume = () => socket?.emit('auction:resume', { lobbyId: id });
  const handleSkip = () => socket?.emit('auction:skip', { lobbyId: id });
  const handleEndAuction = () => {
    setConfirmPrompt({
      title: 'End Auction Early?',
      message: 'Are you sure you want to forcibly end the auction? This will calculate the final results immediately for all teams.',
      confirmText: 'Yes, End Auction',
      confirmStyle: 'btn-danger',
      onConfirm: () => {
        socket?.emit('auction:end', { lobbyId: id });
        setConfirmPrompt(null);
      }
    });
  };

  const handleToggleAIVacancy = (teamId) => {
    socket?.emit('lobby:toggleAIVacancy', { lobbyId: id, teamId });
    toast.info('Toggling team between AI and Vacant...');
  };

  const handleDeleteLobby = () => {
    setConfirmPrompt({
      title: 'Delete Lobby?',
      message: '🚨 Are you sure you want to completely delete this auction and lobby? All records will be lost forever.',
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

  const handleLeaveAuction = () => {
    setConfirmPrompt({
      title: 'Leave Auction?',
      message: '🚨 Are you sure you want to leave this auction? Your team will become vacant for others to claim. If you are the last human, the auction will end.',
      confirmText: 'Leave Room',
      confirmStyle: 'btn-danger',
      onConfirm: async () => {
        try {
          await lobbyAPI.leave(id);
          toast.success('Left auction room');
          navigate('/dashboard');
        } catch (err) {
          toast.error('Failed to leave auction');
        }
        setConfirmPrompt(null);
      }
    });
  };

  const copyCode = () => {
    if (lobby?.code) {
      navigator.clipboard.writeText(lobby.code);
      toast.success('Lobby code copied!');
    }
  };



  if (loading) {
    return <div className="page-loader"><div className="spinner"></div></div>;
  }

  if (!lobby) return null;

  const isAdmin = lobby.admin?._id === user?._id || lobby.admin === user?._id;
  const myTeam = lobby.teams.find(t =>
    !t.isAI && t.user && (t.user?._id || t.user) === user?._id
  );
  const isHighestBidder = currentBidder?._id === user?._id;
  const timerPct = timerDuration > 0 ? (timer / timerDuration) * 100 : 0;
  const isWarning = timer <= 10;

  // Helper for grouping and sorting players
  const groupPlayersByRole = () => {
    const roles = ['Batsman', 'All-Rounder', 'Wicketkeeper', 'Bowler'];
    const tierOrder = { 'Marquee': 0, 'A': 1, 'B': 2, 'C': 3 };

    return roles.reduce((acc, role) => {
      acc[role] = playerPool
        .filter(p => p.role === role)
        .sort((a, b) => (tierOrder[a.tier] ?? 99) - (tierOrder[b.tier] ?? 99) || a.name.localeCompare(b.name));
      return acc;
    }, {});
  };

  const groupedPlayers = groupPlayersByRole();
  const roleLabels = { 'Batsman': '🏏 Batters', 'All-Rounder': '⚡ All-Rounders', 'Wicketkeeper': '🧤 Wicketkeepers', 'Bowler': '⚽ Bowlers' };

  const humanCount = lobby.teams.filter(t => !t.isAI && t.user).length;
  const aiCount = lobby.teams.filter(t => t.isAI).length;

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

      {/* Temporary Pause/Resume Notification */}
      {pauseNotification && (
        <div className="auction-overlay" style={{ zIndex: 11000, background: 'rgba(0,0,0,0.5)' }}>
          <div 
            className="sold-banner" 
            style={{ 
              background: 'rgba(20, 20, 20, 0.95)', 
              border: '2px solid var(--primary-500)',
              padding: '40px 60px',
              animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both'
            }}
          >
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '2px' }}>
              {pauseNotification}
            </h2>
          </div>
        </div>
      )}

      {/* Admin Promotion Modal */}
      {showAdminModal && (
        <div className="squad-modal-overlay" style={{ zIndex: 10001 }}>
          <div className="squad-modal-content" style={{ maxWidth: 450, textAlign: 'center', padding: '48px 32px', border: '2px solid var(--gold-500)', boxShadow: '0 0 50px rgba(255,183,1,0.2)' }}>
            <div style={{ fontSize: 72, marginBottom: 20, animation: 'bounce 2s infinite' }}>👑</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12, background: 'linear-gradient(to bottom, #fff, var(--gold-400))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>The Crown has Passed</h2>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, color: 'var(--text-primary)' }}>You are now the Admin!</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14, lineHeight: 1.6 }}>
              The previous admin has left. You now have full control over the **Bid Timer**, **Pausing**, and **Skipping** players.
            </p>
            <button 
              className="btn btn-gold btn-lg" 
              style={{ width: '100%', fontWeight: 900, fontSize: 16 }}
              onClick={() => setShowAdminModal(false)}
            >
              TAKE CONTROL
            </button>
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
        <div className="container">
        {/* Status Bar */}
        {/* Status Bar */}
        <div className="auction-status-bar" style={{ 
          display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', 
          background: 'var(--bg-card)', border: '1px solid var(--glass-border)', 
          borderRadius: 'var(--radius-lg)', marginBottom: 16 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 14px', background: 'rgba(124,45,255,0.15)', borderRadius: 'var(--radius-full)' }}>
            <span>🏏</span>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Player {playerIndex + 1} / {totalPlayers || '?'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 14px', background: 'rgba(255,193,7,0.1)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,193,7,0.2)' }}>
            <span style={{ fontSize: 13 }}>👥 <span style={{ fontWeight: 800 }}>{humanCount}</span> Humans</span>
            <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: 13 }}>🤖 <span style={{ fontWeight: 800 }}>{aiCount}</span> Bots</span>
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--glass-border)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px' }}>{lobby.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <code style={{ fontSize: 11, color: 'var(--primary-300)', fontWeight: 800, background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4 }}>{lobby.code}</code>
              <button 
                onClick={copyCode}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 10, padding: 0, cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}
              >
                Copy
              </button>
            </div>
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--glass-border)' }} />

          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isPaused ? (
                <button className="btn btn-success btn-sm" onClick={handleResume}>▶ Resume</button>
              ) : (
                <button className="btn btn-outline btn-sm" onClick={handlePause}>⏸ Pause</button>
              )}
              <button className="btn btn-outline btn-sm" onClick={handleSkip}>⏭ Skip</button>
              <button className="btn btn-sm" style={{ background: 'var(--danger-500)', color: 'white', borderColor: 'var(--danger-500)' }} onClick={handleEndAuction}>⏹ End Auction</button>
            </div>

          )}

          <button 
            className="btn btn-gold btn-sm"
            onClick={() => setShowPlayerModal(true)}
          >
            📋 Players
          </button>

          {/* Spacer pushes the following to the right side */}
          <div style={{ flex: 1 }} />

          {/* Timer Adjustment (Admin) */}
          {isAdmin && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', marginRight: 4 }}>⏱ Timer</span>
                <button 
                  className="btn btn-outline btn-sm" 
                  style={{ padding: '0 8px', fontSize: 16, height: 28, minHeight: 28 }}
                  onClick={() => {
                    const val = Math.max(5, timerDuration - 1);
                    setTimerDuration(val);
                    socket?.emit('auction:setTimer', { lobbyId: id, duration: val });
                  }}
                  disabled={timerDuration <= 5}
                >-</button>
                <span className="timer-value-badge" style={{ fontSize: 13, padding: '2px 8px', userSelect: 'none', width: 40, textAlign: 'center' }}>{timerDuration}s</span>
                <button 
                  className="btn btn-outline btn-sm"
                  style={{ padding: '0 8px', fontSize: 16, height: 28, minHeight: 28 }}
                  onClick={() => {
                    const val = Math.min(60, timerDuration + 1);
                    setTimerDuration(val);
                    socket?.emit('auction:setTimer', { lobbyId: id, duration: val });
                  }}
                  disabled={timerDuration >= 60}
                >+</button>
              </div>

              <div style={{ width: 1, height: 24, background: 'var(--glass-border)', margin: '0 8px' }} />

              <button 
                className="btn btn-outline btn-sm"
                onClick={handleDeleteLobby}
                style={{ border: '1px solid var(--danger-500)', color: 'var(--danger-500)', marginRight: 12 }}
              >
                🗑️ Delete Lobby
              </button>
            </>
          )}

          <button 
            className="btn btn-outline btn-sm"
            style={{ color: 'var(--danger-400)', borderColor: 'var(--danger-400)' }}
            onClick={handleLeaveAuction}
          >
            🚪 Exit Room
          </button>
        </div>

        <div className="auction-page">
          {/* Left — Teams Panel */}
          <div className="auction-teams-panel">
            <h3 style={{ fontSize: 14, marginBottom: 8, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Teams
            </h3>
            {lobby.teams.map((team, i) => {
              const isBidder = currentBidder && (currentBidder._id === team._id || currentBidder._id === team.user?._id);
              return (
                <div
                  key={team._id}
                  className={`auction-team-card ${isBidder ? 'current-bidder' : ''}`}
                  onClick={() => setSelectedSquadTeam(team)}
                >
                  <div className="team-row">
                    {(() => {
                      const franchise = IPL_FRANCHISES.find(f => f.name === team.teamName);
                      return franchise?.logo ? (
                        <img src={franchise.logo} alt={team.teamName} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                      ) : (
                        <div
                          className="avatar avatar-sm"
                          style={{ background: TEAM_COLORS[i % TEAM_COLORS.length], width: 28, height: 28, fontSize: 11 }}
                        >
                          {getInitial(team.isAI ? team.teamName : (team.user?.username || 'U'))}
                        </div>
                      );
                    })()}
                    <span className="team-name">{team.teamName}</span>
                    <span className="team-budget">{formatPrice(team.budget)}</span>

                  </div>
                  <div className="team-stats-row">
                    <span>👥 {team.players?.length || 0}/{lobby.settings.maxPlayers}</span>
                    <span>🌍 {team.overseasCount || 0}/{lobby.settings.maxOverseas}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                      {!team.user && (
                        <div className="badge" style={{ fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: team.isAI ? 'rgba(124,45,255,0.2)' : 'rgba(255,193,7,0.2)', color: team.isAI ? 'var(--primary-300)' : 'var(--gold-400)', border: `1px solid ${team.isAI ? 'rgba(124,45,255,0.3)' : 'rgba(255,193,7,0.3)'}` }}>
                          {team.isAI ? '🤖' : '⌛ VACANT'}
                        </div>
                      )}
                      {team.user && (
                        <div className="badge" style={{ 
                          fontSize: '9px', 
                          fontWeight: 700, 
                          padding: '2px 8px', 
                          borderRadius: 'var(--radius-full)', 
                          background: 'rgba(255,255,255,0.1)', 
                          color: 'var(--text-secondary)', 
                          border: '1px solid var(--glass-border)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          {team.user.username || 'User'}
                          { (team.user?._id || team.user) === (lobby.admin?._id || lobby.admin) && (
                            <span title="Lobby Admin" style={{ fontSize: 12 }}>👑</span>
                          )}
                        </div>
                      )}
                      
                      {/* Admin Toggle: Switch between AI and Vacant */}
                      {isAdmin && !team.user && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAIVacancy(team._id);
                          }}
                          className="btn btn-sm"
                          title={team.isAI ? "Switch to Vacant" : "Switch to AI"}
                          style={{ padding: '0 6px', height: 22, minWidth: 22, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 4 }}
                        >
                          {team.isAI ? '👤' : '🤖'}
                        </button>
                      )}

                      {isBidder && <span style={{ color: 'var(--accent-400)', fontWeight: 700 }}>⬆ BIDDING</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center — Main Auction Area */}
          <div className="auction-main">
            {/* Timer */}
            <div>
              <div className="timer-bar-container">
                <div
                  className={`timer-bar-fill ${isWarning ? 'warning' : ''}`}
                  style={{ 
                    width: `${timerPct}%`,
                    background: isPaused ? 'var(--primary-300)' : undefined,
                    boxShadow: isPaused ? '0 0 15px var(--primary-400)' : undefined
                  }}
                />
              </div>
              <div className={`timer-text ${isWarning ? 'warning' : ''}`} style={{ color: isPaused ? 'var(--text-secondary)' : undefined, letterSpacing: isPaused ? '2px' : undefined }}>
                {isPaused ? '⏹ PAUSED' : `${Math.ceil(timer)}s`}
              </div>
            </div>

            {/* Player Showcase */}
            {currentPlayer ? (
              <div 
                className="player-showcase glass-card"
                style={{ 
                  filter: isPaused ? 'grayscale(0.6) blur(1px)' : 'none',
                  opacity: isPaused ? 0.8 : 1,
                  transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isPaused ? 'scale(0.98)' : 'scale(1)'
                }}
              >
                <div
                  className="player-avatar-showcase"
                  style={{ 
                    background: `linear-gradient(135deg, ${TEAM_COLORS[playerIndex % TEAM_COLORS.length]}, var(--primary-600))`,
                  }}
                >
                  {getInitial(currentPlayer.name)}
                </div>

                <div className="player-info-side">
                  <h2 className="player-name">{currentPlayer.name}</h2>

                  <div className="player-details">
                    <span className={`badge ${getTierBadgeClass(currentPlayer.tier)}`}>
                      {currentPlayer.tier === 'Marquee' ? '⭐ ' : ''}{currentPlayer.tier}
                    </span>
                    <span className="badge badge-blue">
                      {getRoleEmoji(currentPlayer.role)} {currentPlayer.role}
                    </span>
                    <span className="badge badge-purple">
                      {currentPlayer.isOverseas ? `🌍 ${currentPlayer.nationality}` : `🇮🇳 India`}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12 }}>
                    {currentPlayer.specialization}
                  </div>

                  <div className="player-stats-grid">
                    {currentPlayer.role !== 'Bowler' && (
                      <>
                        <div className="stat-box">
                          <div className="stat-value">{currentPlayer.stats?.runs || 0}</div>
                          <div className="stat-label">Runs</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value">{currentPlayer.stats?.battingAvg?.toFixed(1) || '0.0'}</div>
                          <div className="stat-label">Bat Avg</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value">{currentPlayer.stats?.strikeRate?.toFixed(1) || '0.0'}</div>
                          <div className="stat-label">SR</div>
                        </div>
                      </>
                    )}
                    {currentPlayer.role !== 'Batsman' && currentPlayer.role !== 'Wicketkeeper' && (
                      <>
                        <div className="stat-box">
                          <div className="stat-value">{currentPlayer.stats?.wickets || 0}</div>
                          <div className="stat-label">Wickets</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value">{currentPlayer.stats?.economy?.toFixed(1) || '0.0'}</div>
                          <div className="stat-label">Economy</div>
                        </div>
                      </>
                    )}
                    <div className="stat-box">
                      <div className="stat-value">{currentPlayer.stats?.matches || 0}</div>
                      <div className="stat-label">Matches</div>
                    </div>
                    {(currentPlayer.role === 'Batsman' || currentPlayer.role === 'Wicketkeeper') && (
                      <div className="stat-box">
                        <div className="stat-value">{currentPlayer.stats?.catches || 0}</div>
                        <div className="stat-label">Catches</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="player-showcase glass-card">
                <p style={{ color: 'var(--text-muted)', padding: 40 }}>
                  Waiting for next player...
                </p>
              </div>
            )}

            {/* Bid Display */}
            <div className="bid-display glass-card">
              <div className="bid-label">
                {currentBid > 0 ? 'Current Bid' : 'Base Price'}
              </div>
              <div className="bid-amount">
                {formatPrice(currentBid > 0 ? currentBid : currentPlayer?.basePrice || 0)}
              </div>
              {currentBidder && (
                <div className="bid-by" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {(() => {
                    const franchise = IPL_FRANCHISES.find(f => f.name === bidderTeamName);
                    return franchise?.logo && (
                      <img src={franchise.logo} alt={bidderTeamName} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                    );
                  })()}
                  <span>Highest Bidder: <strong style={{ color: 'var(--accent-400)' }}>{bidderTeamName || currentBidder.username}</strong></span>
                </div>
              )}

            </div>

            {/* Bid Actions */}
            <div className="bid-actions">
              <button
                className="bid-button"
                onClick={handleBid}
                disabled={isHighestBidder || isPaused || !currentPlayer || timer <= 0}
              >
                {isPaused 
                  ? '⏸ AUCTION PAUSED'
                  : isHighestBidder
                    ? '✅ You are the highest bidder'
                    : `🏏 BID ${formatPrice(nextBidAmount)}`
                }
              </button>
            </div>
          </div>

          {/* Right — Bid History + Info */}
          <div className="auction-sidebar">
            {/* My Budget */}
            <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Your Budget
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 800, color: 'var(--accent-300)' }}>
                {formatPrice(myTeam?.budget || 0)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                {myTeam?.players?.length || 0} players • {myTeam?.overseasCount || 0} overseas
              </div>
            </div>

            {/* Bid History */}
            <div className="bid-history-card glass-card">
              <div className="history-header">📜 Bid History</div>
              <div className="bid-history-list">
                {bidHistory.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 20 }}>
                    No bids yet
                  </p>
                ) : (
                  bidHistory.map((b, i) => (
                    <div key={i} className="bid-history-item">
                      <span className="bidder">{b.username}</span>
                      <span className="bid-amt">{formatPrice(b.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SOLD/UNSOLD Overlay */}
      {showSold && (
        <div className="auction-overlay">
          <div className="sold-banner">
            <h2 className={showSold.type}>
              {showSold.type === 'sold' ? 'SOLD!' : 'UNSOLD'}
            </h2>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 12 }}>
              {showSold.player?.name}
            </div>
            {showSold.type === 'sold' && (
              <div className="sold-details" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 16 }}>
                {(() => {
                  const franchise = IPL_FRANCHISES.find(f => f.name === showSold.buyer?.teamName);
                  return franchise?.logo ? (
                    <img src={franchise.logo} alt={showSold.buyer?.teamName} style={{ width: 80, height: 80, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }} />
                  ) : (
                    <div className="avatar avatar-lg" style={{ background: showSold.buyer?.teamColor || 'var(--primary-600)' }}>
                      {getInitial(showSold.buyer?.teamName || 'T')}
                    </div>
                  );
                })()}
                <div>
                  to <strong>{showSold.buyer?.teamName}</strong> for <strong style={{ color: 'var(--accent-400)', fontSize: 20 }}>{formatPrice(showSold.price)}</strong>
                </div>
              </div>
            )}

            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                Next player in 2 seconds...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Player Intro Modal */}
      {showPlayerIntro && currentPlayer && (
        <div className="auction-overlay" style={{ zIndex: 3000, background: 'rgba(5, 5, 10, 0.95)', backdropFilter: 'blur(12px)' }}>
          <div className="player-intro-modal" style={{ animation: 'scaleUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--primary-300)', textTransform: 'uppercase', letterSpacing: '4px', fontSize: 14, marginBottom: 24, animation: 'fadeInDown 0.5s 0.2s both' }}>
              UP NEXT FOR AUCTION
            </h3>
            
            <div style={{ position: 'relative', marginBottom: 24, animation: 'fadeInUp 0.6s 0.3s both' }}>
              <div style={{ position: 'absolute', inset: -20, background: 'var(--primary-500)', opacity: 0.15, filter: 'blur(30px)', borderRadius: '50%' }}></div>
              <div style={{ fontSize: 72 }}>{getRoleEmoji(currentPlayer.role)}</div>
            </div>

            <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-1px', textShadow: '0 4px 12px rgba(0,0,0,0.5)', marginBottom: 8, animation: 'fadeInUp 0.6s 0.4s both' }}>
              {currentPlayer.name}
            </h1>

            <div style={{ display: 'flex', gap: 12, marginBottom: 32, animation: 'fadeInUp 0.6s 0.5s both' }}>
              <span className={`badge ${getTierBadgeClass(currentPlayer.tier)}`} style={{ fontSize: 14, padding: '4px 12px' }}>
                {currentPlayer.tier} Tier
              </span>
              <span className="badge badge-outline" style={{ fontSize: 14, padding: '4px 12px', border: '1px solid var(--border-secondary)' }}>
                {currentPlayer.role}
              </span>
              <span className="badge badge-outline" style={{ fontSize: 14, padding: '4px 12px', border: '1px solid var(--border-secondary)' }}>
                {currentPlayer.isOverseas ? '✈️ Overseas' : '🇮🇳 Indian'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, width: '100%', maxWidth: 400, animation: 'fadeInUp 0.6s 0.6s both' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 4 }}>Base Price</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-400)' }}>{formatPrice(currentPlayer.basePrice)}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 4 }}>Style</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>{currentPlayer.battingStyle || currentPlayer.bowlingStyle || 'N/A'}</div>
              </div>
            </div>

            <div style={{ marginTop: 40, animation: 'pulse 2s infinite', color: 'var(--text-tertiary)', fontSize: 13, fontWeight: 600 }}>
              Bidding starts shortly...
            </div>
          </div>
        </div>
      )}

      {/* Player Pool Modal */}

      {showPlayerModal && (
        <div className="squad-modal-overlay" onClick={() => setShowPlayerModal(false)}>
          <div className="squad-modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="squad-modal-header">
              <div className="squad-modal-title-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar" style={{ background: 'var(--primary-600)' }}>📋</div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800 }}>Player Pool Status</h2>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Live Auction Tracking</p>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setShowPlayerModal(false)}>✕</button>
              </div>
            </div>
            
            <div className="squad-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {Object.entries(groupedPlayers).map(([role, players]) => (
                  <div key={role}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary-300)', marginBottom: 12, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-secondary)', paddingBottom: 6 }}>
                      <span>{roleLabels[role]}</span>
                      <span className="badge badge-sm" style={{ padding: '0 5px', background: 'rgba(124, 45, 255, 0.2)' }}>{players.length}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                      {players.map((p) => {
                        const soldInfo = soldPlayers.find(s => (s.player?._id || s.player) === (p._id || p));
                        const isUnsold = unsoldPlayers.some(u => (u._id || u) === (p._id || p));
                        const isCurrent = currentPlayer?._id === (p._id || p);
                        
                        let status = 'upcoming';
                        if (soldInfo) status = 'sold';
                        else if (isUnsold) status = 'unsold';
                        else if (isCurrent) status = 'current';

                        return (
                          <div key={p._id || p} className={`player-list-item ${status}`} style={{ padding: '8px 12px', minHeight: '60px' }}>
                            <div className="drawer-player-info">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <div className="drawer-player-name" style={{ fontSize: 13, fontWeight: 700 }}>
                                  {p.name}
                                </div>
                                {status === 'sold' && <span className="badge badge-green" style={{ fontSize: 8, padding: '1px 4px' }}>SOLD</span>}
                                {status === 'unsold' && <span className="badge badge-red" style={{ fontSize: 8, padding: '1px 4px' }}>UNSOLD</span>}
                                {status === 'upcoming' && <span className="badge badge-purple" style={{ fontSize: 8, padding: '1px 4px' }}>UPCOMING</span>}
                                {status === 'current' && <span className="badge badge-gold" style={{ fontSize: 8, padding: '1px 4px', animation: 'pulse 1s infinite' }}>LIVE</span>}
                              </div>
                              <div className="drawer-player-meta" style={{ fontSize: 10 }}>
                                <span className={`badge ${getTierBadgeClass(p.tier)}`} style={{ fontSize: 8, padding: '0px 3px' }}>{p.tier}</span> • {formatPrice(p.basePrice)}
                              </div>
                              {status === 'sold' && (
                                <div className="drawer-team" style={{ marginTop: 2, fontWeight: 800, fontSize: 10, color: 'var(--success-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{color: 'var(--text-tertiary)'}}>Picked by:</span>
                                  <span>{soldInfo.buyerTeamName || soldInfo.buyer?.teamName}</span> 
                                  <span style={{opacity: 0.5}}>•</span>
                                  <span>{formatPrice(soldInfo.price)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paused Overlay (Removed in favor of integrated UI) */}

      {/* Team Squad Modal */}
      {selectedSquadTeam && (
        <div className="squad-modal-overlay" onClick={() => setSelectedSquadTeam(null)}>
          <div className="squad-modal-content" onClick={e => e.stopPropagation()}>
            <div className="squad-modal-header">
              <div className="squad-modal-title-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {(() => {
                    const franchise = IPL_FRANCHISES.find(f => f.name === selectedSquadTeam.teamName);
                    return franchise?.logo ? (
                      <img src={franchise.logo} alt={selectedSquadTeam.teamName} style={{ width: 44, height: 44, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} />
                    ) : (
                      <div 
                        className="avatar" 
                        style={{ background: TEAM_COLORS[lobby.teams.indexOf(selectedSquadTeam) % TEAM_COLORS.length] || 'var(--primary-600)' }}
                      >
                        {getInitial(selectedSquadTeam.teamName)}
                      </div>
                    );
                  })()}
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800 }}>{selectedSquadTeam.teamName}</h2>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Team Squad</p>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setSelectedSquadTeam(null)}>✕</button>
              </div>
              <div className="squad-summary">
                <div className="squad-summary-item">
                  <span className="squad-summary-label">Spent</span>
                  <span className="squad-summary-value">{formatPrice(lobby.settings.budget - selectedSquadTeam.budget)}</span>
                </div>
                <div className="squad-summary-item">
                  <span className="squad-summary-label">Players</span>
                  <span className="squad-summary-value">{selectedSquadTeam.players?.length || 0}/{lobby.settings.maxPlayers}</span>
                </div>
                <div className="squad-summary-item">
                  <span className="squad-summary-label">Overseas</span>
                  <span className="squad-summary-value">{selectedSquadTeam.overseasCount || 0}/{lobby.settings.maxOverseas}</span>
                </div>
              </div>
            </div>
            
            <div className="squad-modal-body">
              {(!selectedSquadTeam.players || selectedSquadTeam.players.length === 0) ? (
                <div className="squad-empty">
                  No players purchased yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {['Batsman', 'All-Rounder', 'Wicketkeeper', 'Bowler'].map(role => {
                    const squadRolePlayers = selectedSquadTeam.players.filter(p => p.role === role);
                    if (squadRolePlayers.length === 0) return null;

                    return (
                      <div key={role}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-tertiary)', marginBottom: 10, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid var(--border-secondary)', paddingBottom: 4 }}>
                          <span>{roleLabels[role]}</span>
                          <span className="badge badge-sm" style={{ padding: '0 5px' }}>{squadRolePlayers.length}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                          {squadRolePlayers.map(player => {
                            const soldInfo = soldPlayers.find(s => (s.player?._id || s.player) === (player._id || player));
                            return (
                              <div key={player._id} className="squad-player-item" style={{ padding: '8px 12px' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {player.name}
                                  </div>
                                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                    {player.tier}
                                  </div>
                                </div>
                                <div className="squad-player-price" style={{ fontSize: 12 }}>
                                  {formatPrice(soldInfo?.price || player.basePrice)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
