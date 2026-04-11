// Auction Engine — Pure logic for the auction state machine

/**
 * Get the bid increment based on current bid amount
 * Follows real IPL auction increment rules
 */
export function getBidIncrement(currentBid) {
  if (currentBid < 100) return 5;
  if (currentBid < 200) return 10;
  if (currentBid < 500) return 20;
  if (currentBid < 1000) return 25;
  return 50;
}

/**
 * Validate if a team can place a bid
 */
export function validateBid(team, player, bidAmount, lobbySettings) {
  const errors = [];

  // Check if team has enough budget
  // They need to keep enough to fill minimum remaining slots at base price
  const currentPlayerCount = team.players.length;
  const remainingSlots = lobbySettings.minPlayers - currentPlayerCount - 1; // -1 for this player
  const minimumReserve = Math.max(0, remainingSlots) * 20; // minimum 20 lakhs per remaining slot

  if (bidAmount + minimumReserve > team.budget) {
    errors.push('Insufficient budget (need to reserve funds for minimum squad)');
  }

  // Check max players
  if (currentPlayerCount >= lobbySettings.maxPlayers) {
    errors.push('Maximum squad size reached');
  }

  // Check overseas limit
  if (player.isOverseas && team.overseasCount >= lobbySettings.maxOverseas) {
    errors.push('Maximum overseas player limit reached');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if team can still participate in bidding for any player
 */
export function canTeamBid(team, lobbySettings) {
  if (team.players.length >= lobbySettings.maxPlayers) return false;
  if (team.budget < 20) return false; // minimum base price
  return true;
}

/**
 * Check if auction should end
 */
export function shouldAuctionEnd(playerPool, teams, lobbySettings) {
  // No more players
  if (!playerPool || playerPool.length === 0) return true;

  // Check if any team can still bid
  const anyTeamCanBid = teams.some(t => canTeamBid(t, lobbySettings));
  if (!anyTeamCanBid) return true;

  return false;
}

/**
 * Organize players by tier for auction order
 */
export function organizePlayerPool(players) {
  const tierOrder = { 'Legend': 0, 'Marquee': 1, 'A': 2, 'B': 3, 'C': 4 };

  // Sort by tier, then shuffle within each tier
  const grouped = {};
  players.forEach(p => {
    const tier = p.tier || 'C';
    if (!grouped[tier]) grouped[tier] = [];
    grouped[tier].push(p);
  });

  const ordered = [];
  ['Legend', 'Marquee', 'A', 'B', 'C'].forEach(tier => {
    if (grouped[tier]) {
      // Shuffle within tier
      const shuffled = grouped[tier].sort(() => Math.random() - 0.5);
      ordered.push(...shuffled);
    }
  });

  return ordered;
}
