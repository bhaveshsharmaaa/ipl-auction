import Lobby from '../models/Lobby.js';

export function setupChatHandlers(io, socket) {
  socket.on('chat:message', async ({ lobbyId, text }) => {
    try {
      if (!text || text.trim().length === 0) return;

      const message = {
        user: socket.user._id,
        username: socket.user.username,
        text: text.trim().substring(0, 500),
        timestamp: new Date()
      };

      // Save to database
      await Lobby.findByIdAndUpdate(lobbyId, {
        $push: {
          messages: {
            $each: [message],
            $slice: -200 // Keep last 200 messages
          }
        }
      });

      // Broadcast to room
      io.to(`lobby:${lobbyId}`).emit('chat:message', message);
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
}
