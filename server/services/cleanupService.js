import Lobby from '../models/Lobby.js';
import AuctionState from '../models/AuctionState.js';
import { clearBidTimer } from '../socket/auctionHandler.js';
import { clearPendingBotBids } from './botService.js';

const CLEANUP_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
let cleanupIntervalId = null;

/**
 * Clean up a single stale room:
 * 1. Notify connected sockets and force them to leave the room
 * 2. Clear all in-memory timers (auction timers, bot bids)
 * 3. Delete AuctionState document (auction data for this lobby)
 * 4. Delete Lobby document
 *
 * NOTE: This is ONLY called for waiting/in-progress lobbies.
 *       Completed lobbies and their auction results are NEVER deleted.
 */
export async function cleanupRoom(io, lobbyId) {
  const lobbyIdStr = lobbyId.toString();

  try {
    // 1. Notify all connected sockets in this room and force-disconnect them from the room
    const roomName = `lobby:${lobbyIdStr}`;
    io.to(roomName).emit('lobby:expired', {
      message: '⏰ This room has expired after 24 hours. The lobby has been automatically removed.'
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

    console.log(`🧹 Cleaned up stale room: ${lobbyIdStr}`);
  } catch (error) {
    console.error(`❌ Failed to clean up room ${lobbyIdStr}:`, error);
  }
}

/**
 * Run the periodic cleanup sweep.
 *
 * Rules:
 *  - DELETE lobbies with status 'waiting' or 'in-progress' whose expiresAt (24h after creation) has passed.
 *  - DELETE any orphaned lobbies stuck in 'expired' status (failed deletion from a previous sweep).
 *  - NEVER touch 'completed' lobbies — they and their AuctionState are kept forever.
 */
async function runCleanupSweep(io) {
  try {
    const now = new Date();
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    let totalCleaned = 0;

    // --- Phase 0: Old lobbies with no expiresAt set (legacy data) ---
    const legacyStaleLobbies = await Lobby.find({
      $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }],
      status: { $in: ['waiting', 'in-progress'] },
      createdAt: { $lte: cutoff24h }
    }).select('_id name status createdAt');

    if (legacyStaleLobbies.length > 0) {
      console.log(`🧹 Cleanup sweep: found ${legacyStaleLobbies.length} legacy room(s) with no expiresAt`);
      for (const lobby of legacyStaleLobbies) {
        console.log(`  → Removing legacy room "${lobby.name}" (${lobby._id}) | status: ${lobby.status} | created: ${lobby.createdAt?.toISOString()}`);
        await Lobby.updateOne({ _id: lobby._id }, { $set: { status: 'expired' } });
        await cleanupRoom(io, lobby._id);
      }
      totalCleaned += legacyStaleLobbies.length;
    }

    // --- Phase 1: Stale active lobbies (waiting / in-progress past their 24h expiresAt) ---
    const staleActiveLobbies = await Lobby.find({
      expiresAt: { $lte: now },
      status: { $in: ['waiting', 'in-progress'] }
    }).select('_id name status createdAt expiresAt');

    if (staleActiveLobbies.length > 0) {
      console.log(`🧹 Cleanup sweep: found ${staleActiveLobbies.length} stale active room(s)`);

      for (const lobby of staleActiveLobbies) {
        console.log(`  → Removing stale room "${lobby.name}" (${lobby._id}) | status: ${lobby.status} | created: ${lobby.createdAt?.toISOString()} | expiresAt: ${lobby.expiresAt?.toISOString()}`);
        // Mark as expired first so it won't show in listings even if deletion fails
        await Lobby.updateOne({ _id: lobby._id }, { $set: { status: 'expired' } });
        await cleanupRoom(io, lobby._id);
      }
      totalCleaned += staleActiveLobbies.length;
    }

    // --- Phase 2: Orphaned expired lobbies that somehow weren't fully deleted ---
    const orphanedExpired = await Lobby.find({
      status: 'expired'
    }).select('_id name');

    if (orphanedExpired.length > 0) {
      console.log(`🧹 Cleanup sweep: found ${orphanedExpired.length} orphaned expired room(s)`);
      for (const lobby of orphanedExpired) {
        await cleanupRoom(io, lobby._id);
      }
      totalCleaned += orphanedExpired.length;
    }

    if (totalCleaned > 0) {
      console.log(`🧹 Cleanup sweep complete: ${totalCleaned} room(s) removed`);
    }
  } catch (error) {
    console.error('❌ Cleanup sweep error:', error);
  }
}

/**
 * Start the periodic cleanup job.
 * Runs immediately on start, then every CLEANUP_INTERVAL_MS.
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
