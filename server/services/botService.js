import { getBidIncrement, validateBid } from './auctionEngine.js';
import AuctionState from '../models/AuctionState.js';
import Lobby from '../models/Lobby.js';
import { processBid } from '../socket/auctionHandler.js'; // We will export this from auctionHandler

// Store pending bot timeouts so they can be cancelled
const pendingBotBids = new Map();

export function calculateBotMaxBid(botTeam, player, lobbySettings) {
  if (botTeam.budget < player.basePrice) return 0;
  
  let maxWillingBid = player.basePrice;
  const squad = botTeam.players || [];
  
  const roles = {
    Batsman: squad.filter(p => p.role === 'Batsman').length,
    Bowler: squad.filter(p => p.role === 'Bowler').length,
    'All-Rounder': squad.filter(p => p.role === 'All-Rounder').length,
    Wicketkeeper: squad.filter(p => p.role === 'Wicketkeeper').length
  };
  
  let needMultiplier = 1.0;
  if (roles[player.role] < 3) needMultiplier += 1.5;
  else if (roles[player.role] < 5) needMultiplier += 0.5;
  else if (roles[player.role] > 6) needMultiplier -= 0.5;
  
  if (player.role === 'Wicketkeeper' && roles['Wicketkeeper'] === 0) needMultiplier += 2.0;

  const tierMultiplier = {
    'Marquee': 4.0,
    'A': 2.5,
    'B': 1.5,
    'C': 1.0
  }[player.tier] || 1.0;

  maxWillingBid = Math.floor(player.basePrice * needMultiplier * tierMultiplier);

  if (player.isOverseas && botTeam.overseasCount >= lobbySettings.maxOverseas - 1) {
    if (player.tier !== 'Marquee') maxWillingBid = 0;
  }

  const remainingSlots = lobbySettings.minPlayers - (squad.length + 1);
  const minRequiredReserve = Math.max(0, remainingSlots * 20); 
  const availableBudget = botTeam.budget - minRequiredReserve;
  
  return Math.min(maxWillingBid, availableBudget);
}

export async function scheduleBotBids(io, lobbyId) {
  // Clear any existing pending bot bids for this lobby
  clearPendingBotBids(lobbyId);

  const lobby = await Lobby.findById(lobbyId).populate('teams.players');
  const auctionState = await AuctionState.findOne({ lobby: lobbyId }).populate('currentPlayer');
  
  if (!lobby || !auctionState || auctionState.status !== 'player-bidding') return;
  
  const aiTeams = lobby.teams.filter(t => t.isAI);
  if (aiTeams.length === 0) return;

  const currentPlayer = auctionState.currentPlayer;
  
  let nextBidAmount = auctionState.currentBid === 0 
    ? currentPlayer.basePrice 
    : auctionState.currentBid + getBidIncrement(auctionState.currentBid);

  let possibleBidders = [];

  for (const botTeam of aiTeams) {
    // Skip if bot is already the highest bidder
    if (auctionState.currentBidder && auctionState.currentBidder.toString() === botTeam._id.toString()) {
      continue;
    }

    // Skip if validation fails
    const validation = validateBid(botTeam, currentPlayer, nextBidAmount, lobby.settings);
    if (!validation.valid) continue;

    // Check willingness
    const maxWilling = calculateBotMaxBid(botTeam, currentPlayer, lobby.settings);
    if (maxWilling >= nextBidAmount) {
      possibleBidders.push(botTeam);
    }
  }

  if (possibleBidders.length > 0) {
    // Pick a random willing bot
    const chosenBot = possibleBidders[Math.floor(Math.random() * possibleBidders.length)];
    
    // Random delay between 1.5s and 4.5s
    const delay = Math.floor(Math.random() * 3000) + 1500;
    
    const timeout = setTimeout(async () => {
      // Re-fetch auction state to ensure it hasn't changed (someone else bid first)
      const currentState = await AuctionState.findOne({ lobby: lobbyId });
      if (currentState && currentState.currentBid === auctionState.currentBid) {
         // Place the bid via common function
         await processBid(io, lobbyId, chosenBot, true);
      }
    }, delay);

    pendingBotBids.set(lobbyId.toString(), timeout);
  }
}

export function clearPendingBotBids(lobbyId) {
  const existing = pendingBotBids.get(lobbyId.toString());
  if (existing) {
    clearTimeout(existing);
    pendingBotBids.delete(lobbyId.toString());
  }
}
