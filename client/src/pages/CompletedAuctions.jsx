import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { lobbyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getInitial } from '../utils/helpers';

export default function CompletedAuctions() {
  const [lobbies, setLobbies] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchCompletedLobbies();
  }, []);

  const fetchCompletedLobbies = async () => {
    try {
      const res = await lobbyAPI.completed();
      console.log('Completed auctions response:', res.data);
      setLobbies(res.data);
    } catch (err) {
      console.error('Failed to fetch completed lobbies:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>🏆 Completed Auctions</h1>
          <p>Review the results of your past IPL auctions</p>
        </div>

        <div className="lobbies-section">
          {loading ? (
            <div className="page-loader"><div className="spinner"></div></div>
          ) : (lobbies && lobbies.length === 0) ? (
            <div className="glass-card" style={{ padding: '64px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏁</div>
              <h3>No completed auctions yet</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                Finish an auction to see its results here.
              </p>
              <button 
                className="btn btn-primary btn-sm" 
                style={{ marginTop: '24px' }}
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="lobby-list">
              {lobbies.map(lobby => (
                <div key={lobby._id} className="lobby-item glass-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/results/${lobby._id}`)}>
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
                        <span>👥 {lobby.teams.length}/{lobby.maxTeams}</span>
                        <span>🏏 By {lobby.admin?.username}</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>
                          ● Completed
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/results/${lobby._id}`);
                      }}
                    >
                      View Results
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
