import Lobby from '../models/Lobby.js';
import Player from '../models/Player.js';
import AuctionState from '../models/AuctionState.js';
import { getBidIncrement, validateBid, shouldAuctionEnd, organizePlayerPool } from '../services/auctionEngine.js';
import { scheduleBotBids, clearPendingBotBids } from '../services/botService.js';

// Active timers per lobby
const auctionTimers = new Map();

export function setupAuctionHandlers(io, socket) {

  // Admin starts the auction
  socket.on('auction:start', async ({ lobbyId }) => {
    try {
      const lobby = await Lobby.findById(lobbyId).populate('teams.user', 'username avatar');
      if (!lobby) return socket.emit('error', { message: 'Lobby not found' });

      // Only admin can start
      if (lobby.admin.toString() !== socket.user._id.toString()) {
        return socket.emit('error', { message: 'Only admin can start the auction' });
      }

      if (lobby.status !== 'waiting') {
        return socket.emit('error', { message: 'Auction already started' });
      }

      // Need at least 2 teams, and at least 1 human
      const humanCount = lobby.teams.filter(t => t.user && !t.isAI).length;
      if (lobby.teams.length < 2) {
        return socket.emit('error', { message: 'Need at least 2 teams to start' });
      }
      if (humanCount < 1) {
        return socket.emit('error', { message: 'Need at least 1 human player to start' });
      }

      // Get all players and organize them
      const allPlayers = await Player.find({});
      const orderedPlayers = organizePlayerPool(allPlayers);
      const playerIds = orderedPlayers.map(p => p._id);

      // Create auction state
      let auctionState = await AuctionState.findOne({ lobby: lobbyId });
      if (auctionState) {
        await AuctionState.deleteOne({ _id: auctionState._id });
      }

      auctionState = await AuctionState.create({
        lobby: lobbyId,
        playerPool: playerIds,
        currentPlayer: playerIds[0],
        currentBid: 0,
        currentBidder: null,
        bidHistory: [],
        soldPlayers: [],
        unsoldPlayers: [],
        currentPlayerIndex: 0,
        round: 1,
        status: 'player-bidding'
      });

      // Update lobby status
      lobby.status = 'in-progress';
      await lobby.save();

      // Populate for broadcast
      const populatedState = await AuctionState.findById(auctionState._id)
        .populate('currentPlayer')
        .populate('playerPool');

      const populatedLobby = await Lobby.findById(lobbyId)
        .populate('admin', 'username avatar')
        .populate('teams.user', 'username avatar');

      io.to(`lobby:${lobbyId}`).emit('auction:started', {
        auction: populatedState,
        lobby: populatedLobby
      });

      // Start timer for first player
      startBidTimer(io, lobbyId, lobby.settings.bidTimer);

    } catch (error) {
      console.error('Auction start error:', error);
      socket.emit('error', { message: 'Failed to start auction' });
    }
  });

  // Place a bid
  socket.on('auction:bid', async ({ lobbyId }) => {
    try {
      const lobby = await Lobby.findById(lobbyId).populate('teams.players');
      if (!lobby) return;

      const team = lobby.teams.find(t => !t.isAI && t.user && t.user.toString() === socket.user._id.toString());
      if (!team) return socket.emit('error', { message: 'You are not in this lobby' });

      await processBid(io, lobbyId, team, false, socket);

    } catch (error) {
      console.error('Bid error:', error);
      socket.emit('error', { message: 'Failed to place bid' });
    }
  });

  // Admin pause
  socket.on('auction:pause', async ({ lobbyId }) => {
    try {
      const lobby = await Lobby.findById(lobbyId);
      if (!lobby || lobby.admin.toString() !== socket.user._id.toString()) return;

      const auctionState = await AuctionState.findOne({ lobby: lobbyId });
      if (!auctionState) return;

      clearBidTimer(lobbyId);
      clearPendingBotBids(lobbyId); // Stop AI from bidding during pause
      auctionState.status = 'paused';
      await auctionState.save();

      io.to(`lobby:${lobbyId}`).emit('auction:paused', {});
    } catch (error) {
      socket.emit('error', { message: 'Failed to pause' });
    }
  });

  // Admin set timer duration
  socket.on('auction:setTimer', async ({ lobbyId, duration }) => {
    try {
      const lobby = await Lobby.findById(lobbyId);
      if (!lobby || lobby.admin.toString() !== socket.user._id.toString()) return;

      const clampedDuration = Math.min(30, Math.max(5, parseInt(duration) || 10));
      lobby.settings.bidTimer = clampedDuration;
      await lobby.save();

      io.to(`lobby:${lobbyId}`).emit('auction:timerUpdated', { duration: clampedDuration });
    } catch (error) {
      socket.emit('error', { message: 'Failed to update timer' });
    }
  });

  // Admin resume
  socket.on('auction:resume', async ({ lobbyId }) => {
    try {
      const lobby = await Lobby.findById(lobbyId);
      if (!lobby || lobby.admin.toString() !== socket.user._id.toString()) return;

      const auctionState = await AuctionState.findOne({ lobby: lobbyId });
      if (!auctionState || auctionState.status !== 'paused') return;

      auctionState.status = 'player-bidding';
      await auctionState.save();

      io.to(`lobby:${lobbyId}`).emit('auction:resumed', {});
      startBidTimer(io, lobbyId, lobby.settings.bidTimer);
    } catch (error) {
      socket.emit('error', { message: 'Failed to resume' });
    }
  });

  // Admin skip (mark unsold)
  socket.on('auction:skip', async ({ lobbyId }) => {
    try {
      const lobby = await Lobby.findById(lobbyId);
      if (!lobby || lobby.admin.toString() !== socket.user._id.toString()) return;

      clearBidTimer(lobbyId);
      clearPendingBotBids(lobbyId);
      await handleTimerExpiry(io, lobbyId);
    } catch (error) {
      socket.emit('error', { message: 'Failed to skip' });
    }
  });

  // Admin end auction
  socket.on('auction:end', async ({ lobbyId }) => {
    try {
      const lobby = await Lobby.findById(lobbyId);
      if (!lobby || lobby.admin.toString() !== socket.user._id.toString()) return;

      const auctionState = await AuctionState.findOne({ lobby: lobbyId });
      if (!auctionState) return;

      clearBidTimer(lobbyId);
      clearPendingBotBids(lobbyId);

      auctionState.status = 'completed';
      auctionState.currentPlayer = null;
      auctionState.currentBid = 0;
      auctionState.currentBidder = null;
      await auctionState.save();

      lobby.status = 'completed';
      await lobby.save();

      io.to(`lobby:${lobbyId}`).emit('auction:completed', {
        message: 'Auction was ended early by the admin.'
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to end auction' });
    }
  });
}

// Extracted bid processing logic so AI bots can trigger it seamlessly
export async function processBid(io, lobbyId, team, isBot = false, socket = null) {
  try {
    const lobby = await Lobby.findById(lobbyId).populate('teams.players');
    if (!lobby) return;

    const auctionState = await AuctionState.findOne({ lobby: lobbyId }).populate('currentPlayer');
    if (!auctionState || auctionState.status !== 'player-bidding') return;

    // Calculate bid amount
    const currentPlayer = auctionState.currentPlayer;
    let bidAmount;

    if (auctionState.currentBid === 0) {
      bidAmount = currentPlayer.basePrice;
    } else {
      const increment = getBidIncrement(auctionState.currentBid);
      bidAmount = auctionState.currentBid + increment;
    }

    // Can't bid on yourself if you're already the highest bidder
    const bidderId = team.isAI ? team._id : team.user;
    if (auctionState.currentBidder && auctionState.currentBidder.toString() === bidderId.toString()) {
      if (!isBot && socket) socket.emit('error', { message: 'You are already the highest bidder' });
      return;
    }

    // Validate bid
    const validation = validateBid(team, currentPlayer, bidAmount, lobby.settings);
    if (!validation.valid) {
      if (!isBot && socket) socket.emit('error', { message: validation.errors[0] });
      return;
    }

    // Place bid
    auctionState.currentBid = bidAmount;
    auctionState.currentBidder = bidderId;
    const bidderUsername = team.isAI ? team.teamName : (socket ? socket.user.username : team.teamName);
    
    auctionState.bidHistory.push({
      user: bidderId,
      username: bidderUsername,
      amount: bidAmount,
      timestamp: new Date()
    });

    await auctionState.save();

    // Broadcast bid update
    io.to(`lobby:${lobbyId}`).emit('auction:bidUpdate', {
      bidder: {
        _id: bidderId,
        username: bidderUsername
      },
      bidderTeamName: team.teamName,
      bidderTeamColor: team.teamColor,
      amount: bidAmount,
      nextBid: bidAmount + getBidIncrement(bidAmount),
      player: currentPlayer
    });

    // Reset timer
    startBidTimer(io, lobbyId, lobby.settings.bidTimer);

  } catch (error) {
    console.error('Bid error:', error);
    if (!isBot && socket) socket.emit('error', { message: 'Failed to place bid' });
  }
}

function startBidTimer(io, lobbyId, duration) {
  clearBidTimer(lobbyId);

  const timerEnd = new Date(Date.now() + duration * 1000);

  // Update timer end in DB
  AuctionState.findOneAndUpdate(
    { lobby: lobbyId },
    { timerEnd },
    { new: true }
  ).then(() => {
    io.to(`lobby:${lobbyId}`).emit('auction:timerStart', {
      duration,
      timerEnd: timerEnd.toISOString()
    });
  });

  const timer = setTimeout(() => {
    handleTimerExpiry(io, lobbyId);
  }, duration * 1000);

  auctionTimers.set(lobbyId.toString(), timer);
  
  // Triggers bot thinking loop
  scheduleBotBids(io, lobbyId);
}

function clearBidTimer(lobbyId) {
  const existingTimer = auctionTimers.get(lobbyId.toString());
  if (existingTimer) {
    clearTimeout(existingTimer);
    auctionTimers.delete(lobbyId.toString());
  }
}

async function handleTimerExpiry(io, lobbyId) {
  clearPendingBotBids(lobbyId); // Clear any pending bots when timer naturally expires or skips

  try {
    const auctionState = await AuctionState.findOne({ lobby: lobbyId }).populate('currentPlayer');
    if (!auctionState || auctionState.status === 'completed' || auctionState.status === 'paused') return;

    const lobby = await Lobby.findById(lobbyId)
      .populate('teams.user', 'username avatar')
      .populate('teams.players');

    if (!lobby) return;

    const currentPlayer = auctionState.currentPlayer;

    if (auctionState.currentBid > 0 && auctionState.currentBidder) {
      // SOLD!
      const buyerTeam = lobby.teams.find(t => 
        (t.isAI && t._id.toString() === auctionState.currentBidder.toString()) || 
        (!t.isAI && t.user && t.user._id.toString() === auctionState.currentBidder.toString())
      );

      if (buyerTeam) {
        buyerTeam.players.push(currentPlayer._id);
        buyerTeam.budget -= auctionState.currentBid;
        if (currentPlayer.isOverseas) {
          buyerTeam.overseasCount = (buyerTeam.overseasCount || 0) + 1;
        }

        auctionState.soldPlayers.push({
          player: currentPlayer._id,
          buyer: auctionState.currentBidder,
          buyerTeamName: buyerTeam.teamName,
          price: auctionState.currentBid
        });

        // Use findByIdAndUpdate for atomic save
        await Lobby.findByIdAndUpdate(lobby._id, { teams: lobby.teams });
      }

      const buyerUsername = buyerTeam?.isAI ? buyerTeam.teamName : buyerTeam?.user?.username;

      io.to(`lobby:${lobbyId}`).emit('auction:playerSold', {
        player: currentPlayer,
        buyer: {
          _id: auctionState.currentBidder,
          username: buyerUsername,
          teamName: buyerTeam?.teamName,
          teamColor: buyerTeam?.teamColor
        },
        price: auctionState.currentBid
      });

    } else {
      // UNSOLD
      auctionState.unsoldPlayers.push(currentPlayer._id);

      io.to(`lobby:${lobbyId}`).emit('auction:playerUnsold', {
        player: currentPlayer
      });
    }

    // Broadcast team updates
    const updatedLobby = await Lobby.findById(lobbyId)
      .populate('admin', 'username avatar')
      .populate('teams.user', 'username avatar')
      .populate('teams.players');

    io.to(`lobby:${lobbyId}`).emit('lobby:updated', updatedLobby);

    // Move to next player
    auctionState.currentPlayerIndex += 1;

    // Check if auction should end
    if (shouldAuctionEnd(
      auctionState.playerPool.slice(auctionState.currentPlayerIndex),
      lobby.teams,
      lobby.settings
    )) {
      // Auction complete
      auctionState.status = 'completed';
      auctionState.currentPlayer = null;
      auctionState.currentBid = 0;
      auctionState.currentBidder = null;
      
      // Use findByIdAndUpdate for atomic save
      await AuctionState.findByIdAndUpdate(auctionState._id, {
        status: auctionState.status,
        currentPlayer: auctionState.currentPlayer,
        currentBid: auctionState.currentBid,
        currentBidder: auctionState.currentBidder,
        currentPlayerIndex: auctionState.currentPlayerIndex,
        soldPlayers: auctionState.soldPlayers,
        unsoldPlayers: auctionState.unsoldPlayers
      });

      await Lobby.findByIdAndUpdate(lobbyId, { status: 'completed' });

      io.to(`lobby:${lobbyId}`).emit('auction:completed', {
        message: 'Auction has ended!'
      });
      return;
    }

    // Set up next player
    const nextPlayerIndex = auctionState.currentPlayerIndex;
    if (nextPlayerIndex < auctionState.playerPool.length) {
      auctionState.currentPlayer = auctionState.playerPool[nextPlayerIndex];
      auctionState.currentBid = 0;
      auctionState.currentBidder = null;
      auctionState.bidHistory = [];
      auctionState.status = 'player-bidding';
      
      // Use findByIdAndUpdate for atomic save
      await AuctionState.findByIdAndUpdate(auctionState._id, {
        currentPlayer: auctionState.currentPlayer,
        currentBid: auctionState.currentBid,
        currentBidder: auctionState.currentBidder,
        bidHistory: auctionState.bidHistory,
        status: auctionState.status,
        currentPlayerIndex: auctionState.currentPlayerIndex,
        soldPlayers: auctionState.soldPlayers,
        unsoldPlayers: auctionState.unsoldPlayers
      });

      const nextPlayer = await Player.findById(auctionState.playerPool[nextPlayerIndex]);

      // 2-second delay showing SOLD/UNSOLD before presenting next player
      setTimeout(() => {
        io.to(`lobby:${lobbyId}`).emit('auction:newPlayer', {
          player: nextPlayer,
          index: nextPlayerIndex,
          total: auctionState.playerPool.length
        });

        // 2-second delay showing the cinematic Intro Modal before starting the bid timer
        setTimeout(() => {
          startBidTimer(io, lobbyId, lobby.settings.bidTimer);
        }, 3000);
      }, 3000);
    }

  } catch (error) {
    console.error('Timer expiry error:', error);
  }
}
