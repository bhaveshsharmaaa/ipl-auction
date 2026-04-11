import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { setupLobbyHandlers } from './lobbyHandler.js';
import { setupAuctionHandlers } from './auctionHandler.js';
import { setupChatHandlers } from './chatHandler.js';

export function setupSocket(io) {
  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);

    setupLobbyHandlers(io, socket);
    setupAuctionHandlers(io, socket);
    setupChatHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.username} (${socket.id})`);
    });
  });
}
