import Lobby from '../models/Lobby.js';
import AuctionState from '../models/AuctionState.js';
import { clearBidTimer } from '../socket/auctionHandler.js';
import { clearPendingBotBids } from './botService.js';

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let cleanupIntervalId = null;

/**
 * Clean up a single expired room:
 * 1. Notify connected sockets and force them to leave the room
 * 2. Clear all in-memory timers (auction timers, bot bids)
 * 3. Delete AuctionState document
 * 4. Delete Lobby document
 */
export async function cleanupRoom(io, lobbyId) {
  const lobbyIdStr = lobbyId.toString();

  try {
    // 1. Notify all connected sockets in this room and force-disconnect them from the room
    const roomName = `lobby:${lobbyIdStr}`;
    io.to(roomName).emit('lobby:expired', {
      message: '⏰ This room has expired after 24 hours of inactivity. The lobby has been automatically removed.'
    });

    // Force all sockets to leave the room
    const socketsInRoom = await io.in(roomName).fetchSockets();
    for (const socket of socketsInRoom) {
      socket.leave(roomName);
    }

    // 2. Clear in-memory timers
    clearBidTimer(lobbyIdStr);
    clearPendingBotBids(lobbyIdStr);

    // 3. Delete AuctionState (temporary auction data) for this lobby
    await AuctionState.deleteOne({ lobby: lobbyId });

    // 4. Delete the Lobby document itself
    await Lobby.findByIdAndDelete(lobbyId);

    console.log(`🧹 Cleaned up expired room: ${lobbyIdStr}`);
  } catch (error) {
    console.error(`❌ Failed to clean up room ${lobbyIdStr}:`, error);
  }
}

/**
 * Run the periodic cleanup sweep:
 * Find all lobbies where expiresAt has passed and status is NOT 'completed' or 'expired',
 * then clean each one up.
 */
async function runCleanupSweep(io) {
  try {
    const now = new Date();

    // Find expired lobbies that are NOT completed (and NOT already marked expired)
    const expiredLobbies = await Lobby.find({
      expiresAt: { $lte: now },
      status: { $nin: ['completed', 'expired'] }
    }).select('_id name status createdAt expiresAt');

    if (expiredLobbies.length === 0) return;

    console.log(`🧹 Cleanup sweep: found ${expiredLobbies.length} expired room(s)`);

    for (const lobby of expiredLobbies) {
      console.log(`  → Expiring room "${lobby.name}" (${lobby._id}) | status: ${lobby.status} | created: ${lobby.createdAt?.toISOString()} | expired: ${lobby.expiresAt?.toISOString()}`);
      await cleanupRoom(io, lobby._id);
    }

    console.log(`🧹 Cleanup sweep complete: ${expiredLobbies.length} room(s) removed`);
  } catch (error) {
    console.error('❌ Cleanup sweep error:', error);
  }
}

/**
 * Start the periodic cleanup job.
 * Runs immediately on start, then every CLEANUP_INTERVAL_MS (5 minutes).
 */
export function startCleanupJob(io) {
  // Run an initial sweep on startup (catches rooms that expired while server was down)
  runCleanupSweep(io);

  // Schedule periodic sweeps
  cleanupIntervalId = setInterval(() => {
    runCleanupSweep(io);
  }, CLEANUP_INTERVAL_MS);

  // Ensure the interval doesn't prevent Node.js from exiting gracefully
  if (cleanupIntervalId.unref) {
    cleanupIntervalId.unref();
  }

  console.log(`🧹 Room cleanup job started (runs every ${CLEANUP_INTERVAL_MS / 60000} minutes)`);
}

/**
 * Stop the cleanup job (for graceful shutdown).
 */
export function stopCleanupJob() {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
    console.log('🧹 Room cleanup job stopped');
  }
}
