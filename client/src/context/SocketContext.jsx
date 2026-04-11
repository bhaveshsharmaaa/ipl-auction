import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (token && user) {
      const s = connectSocket(token);
      socketRef.current = s;

      s.on('connect', () => setConnected(true));
      s.on('disconnect', () => setConnected(false));

      return () => {
        disconnectSocket();
        setConnected(false);
      };
    }
  }, [token, user]);

  const socket = socketRef.current || getSocket();

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
