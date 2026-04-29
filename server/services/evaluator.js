/**
 * Post-Auction Team Evaluator
 * Scores each team out of 100 across weighted categories
 */

function calcStarPower(team, soldPlayers) {
  let score = 0;
  const teamSold = soldPlayers.filter(sp =>
    (team.user && sp.buyer?.toString() === team.user._id?.toString()) ||
    (team.user && sp.buyer?.toString() === team.user?.toString()) ||
    (sp.buyer?.toString() === team._id?.toString())
  );

  const players = team.players || [];

  // Count tier distribution
  let marqueeCount = 0, tierACount = 0;
  players.forEach(p => {
    if (p.tier === 'Marquee') { marqueeCount++; score += 8; }
    else if (p.tier === 'A') { tierACount++; score += 4; }
    else if (p.tier === 'B') { score += 2; }
    else { score += 1; }
  });

  // Bonus for having marquee players
  if (marqueeCount >= 2) score += 5;
  if (marqueeCount >= 3) score += 5;

  return Math.min(25, score);
}

function calcSquadBalance(team) {
  const players = team.players || [];
  let score = 0;

  const roles = { Batsman: 0, Bowler: 0, 'All-Rounder': 0, Wicketkeeper: 0 };
  players.forEach(p => {
    if (roles[p.role] !== undefined) roles[p.role]++;
  });

  // Wicketkeepers (ideal: 2-3)
  if (roles.Wicketkeeper >= 2) score += 4;
  else if (roles.Wicketkeeper >= 1) score += 2;

  // Batsmen (ideal: 5-7)
  if (roles.Batsman >= 5 && roles.Batsman <= 7) score += 5;
  else if (roles.Batsman >= 3) score += 3;

  // Bowlers (ideal: 5-7)
  if (roles.Bowler >= 5 && roles.Bowler <= 7) score += 5;
  else if (roles.Bowler >= 3) score += 3;

  // All-rounders (ideal: 3-5)
  if (roles['All-Rounder'] >= 3 && roles['All-Rounder'] <= 5) score += 4;
  else if (roles['All-Rounder'] >= 2) score += 2;

  // Squad size bonus
  if (players.length >= 18) score += 2;

  return Math.min(20, score);
}

function calcOverseasMix(team, settings) {
  const players = team.players || [];
  let score = 0;

  const overseas = players.filter(p => p.isOverseas);
  const overseasCount = overseas.length;

  // Having 4-6 quality overseas players is ideal
  if (overseasCount >= 4 && overseasCount <= 6) score += 5;
  else if (overseasCount >= 2) score += 3;

  // Quality of overseas picks
  overseas.forEach(p => {
    if (p.tier === 'Marquee' || p.tier === 'A') score += 1;
  });

  // Diversity (different nationalities)
  const nationalities = new Set(overseas.map(p => p.nationality));
  score += Math.min(3, nationalities.size);

  return Math.min(10, score);
}

function calcBudgetEfficiency(team, soldPlayers) {
  const players = team.players || [];
  let score = 0;

  const totalSpent = (team.budget !== undefined)
    ? (10000 - team.budget)
    : 0;

  if (totalSpent === 0 || players.length === 0) return 0;

  // Calculate aggregate stat value
  let totalStatValue = 0;
  players.forEach(p => {
    const s = p.stats || {};
    totalStatValue += (s.battingAvg || 0) * 2
      + (s.strikeRate || 0) * 0.5
      + (s.wickets || 0) * 3
      + (s.runs || 0) * 0.02
      + (s.catches || 0);
  });

  // Efficiency = value per crore spent
  const efficiency = totalStatValue / (totalSpent / 100);

  if (efficiency > 50) score = 15;
  else if (efficiency > 30) score = 12;
  else if (efficiency > 20) score = 9;
  else if (efficiency > 10) score = 6;
  else score = 3;

  return Math.min(15, score);
}

function calcBattingStrength(team) {
  const players = team.players || [];
  let score = 0;

  const batsmen = players
    .filter(p => p.role === 'Batsman' || p.role === 'All-Rounder' || p.role === 'Wicketkeeper')
    .sort((a, b) => (b.stats?.battingAvg || 0) - (a.stats?.battingAvg || 0))
    .slice(0, 7);

  let totalAvg = 0, totalSR = 0;
  batsmen.forEach(p => {
    totalAvg += p.stats?.battingAvg || 0;
    totalSR += p.stats?.strikeRate || 0;
  });

  const avgPerBatsman = batsmen.length > 0 ? totalAvg / batsmen.length : 0;
  const srPerBatsman = batsmen.length > 0 ? totalSR / batsmen.length : 0;

  if (avgPerBatsman > 35) score += 8;
  else if (avgPerBatsman > 25) score += 5;
  else if (avgPerBatsman > 15) score += 3;

  if (srPerBatsman > 140) score += 7;
  else if (srPerBatsman > 125) score += 5;
  else if (srPerBatsman > 110) score += 3;

  return Math.min(15, score);
}

function calcBowlingStrength(team) {
  const players = team.players || [];
  let score = 0;

  const bowlers = players
    .filter(p => p.role === 'Bowler' || p.role === 'All-Rounder')
    .sort((a, b) => (b.stats?.wickets || 0) - (a.stats?.wickets || 0))
    .slice(0, 6);

  let totalWickets = 0, totalEcon = 0, econCount = 0;
  bowlers.forEach(p => {
    totalWickets += p.stats?.wickets || 0;
    if (p.stats?.economy > 0) {
      totalEcon += p.stats.economy;
      econCount++;
    }
  });

  const avgEcon = econCount > 0 ? totalEcon / econCount : 10;

  if (totalWickets > 100) score += 8;
  else if (totalWickets > 60) score += 6;
  else if (totalWickets > 30) score += 4;
  else score += 2;

  if (avgEcon < 7.5) score += 7;
  else if (avgEcon < 8.5) score += 5;
  else if (avgEcon < 9.5) score += 3;

  return Math.min(15, score);
}

/**
 * Categorize a player's bowling style from their specialization string
 * Returns: 'pace', 'spin', or 'none'
 */
function getBowlingType(player) {
  const spec = (player.specialization || '').toLowerCase();
  if (/fast|medium|seam|pace/.test(spec)) return 'pace';
  if (/spin|leg.?spin|off.?spin|left.?arm orthodox|chinaman|mystery/.test(spec)) return 'spin';
  // For bowlers/all-rounders without a specialization, infer from economy/wickets
  if (player.role === 'Bowler' || player.role === 'All-Rounder') {
    if (player.stats?.wickets > 0) return 'pace'; // default assumption
  }
  return 'none';
}

/**
 * Score a player's IPL fitness for Best XI selection.
 * Considers batting impact (avg + SR), bowling impact (wickets + economy), and tier.
 */
function calcPlayerXIScore(player) {
  const s = player.stats || {};
  let score = 0;

  // Batting value — weight strike rate heavily for T20
  score += (s.battingAvg || 0) * 1.5;
  score += Math.max(0, ((s.strikeRate || 0) - 100)) * 0.4;
  score += (s.runs || 0) * 0.005;
  score += (s.fifties || 0) * 3;
  score += (s.hundreds || 0) * 8;

  // Bowling value
  score += (s.wickets || 0) * 2;
  if (s.economy > 0) score += Math.max(0, (10 - s.economy)) * 5;
  if (s.bowlingAvg > 0 && s.bowlingAvg < 30) score += (30 - s.bowlingAvg) * 0.8;

  // Tier bonus
  if (player.tier === 'Marquee') score += 20;
  else if (player.tier === 'Legend') score += 18;
  else if (player.tier === 'A') score += 12;
  else if (player.tier === 'B') score += 5;

  // All-rounder versatility bonus
  if (player.role === 'All-Rounder') {
    if ((s.battingAvg || 0) > 20 && (s.wickets || 0) > 20) score += 15;
    else if ((s.battingAvg || 0) > 15 && (s.wickets || 0) > 10) score += 8;
  }

  return score;
}

/**
 * Generate the Best Playing XI following IPL rules:
 *
 * HARD CONSTRAINTS:
 *  - Maximum 4 overseas players in the XI
 *
 * COMPOSITION TARGETS (ideal IPL template):
 *  - 1 Wicketkeeper (who bats in top order)
 *  - 3-4 specialist Batsmen (explosive top order + anchor)
 *  - 2-3 All-Rounders (versatile batting depth + bowling options)
 *  - 3-4 Bowlers (mix of pace and spin for bowling variety)
 *
 * BOWLING VARIETY:
 *  - At least 2 pacers and at least 1 spinner (death-overs & mystery spin coverage)
 *  - Prefer diverse bowling specializations
 */
function generateBestXI(team) {
  const rawPlayers = team.players || [];
  // Convert Mongoose docs to plain objects so property access works reliably
  const players = rawPlayers.map(p => (typeof p.toObject === 'function') ? p.toObject() : p);

  if (players.length <= 11) return players;

  // Score every player once
  players.forEach(p => { p.xiScore = calcPlayerXIScore(p); });

  // Separate by role, sorted by score
  const byRole = {
    Wicketkeeper: players.filter(p => p.role === 'Wicketkeeper').sort((a, b) => b.xiScore - a.xiScore),
    Batsman: players.filter(p => p.role === 'Batsman').sort((a, b) => b.xiScore - a.xiScore),
    'All-Rounder': players.filter(p => p.role === 'All-Rounder').sort((a, b) => b.xiScore - a.xiScore),
    Bowler: players.filter(p => p.role === 'Bowler').sort((a, b) => b.xiScore - a.xiScore),
  };

  // ──── Track XI via ID set ────
  const xi = [];
  const xiIds = new Set();
  const MAX_OVERSEAS = 4;

  const pid = (p) => (p._id || p.name || '').toString();
  const overseasInXI = () => xi.filter(p => p.isOverseas).length;
  const isInXI = (p) => xiIds.has(pid(p));

  const tryAdd = (p) => {
    if (!p || isInXI(p)) return false;
    if (p.isOverseas && overseasInXI() >= MAX_OVERSEAS) return false;
    xi.push(p);
    xiIds.add(pid(p));
    return true;
  };

  // 1a. Pick 1 wicketkeeper (mandatory)
  for (const p of byRole.Wicketkeeper) {
    if (tryAdd(p)) break;
  }

  // 1b. Pick 4 batsmen (explosive top order + anchor)
  let batsmenAdded = 0;
  const targetBatsmen = Math.min(4, byRole.Batsman.length);
  for (const p of byRole.Batsman) {
    if (batsmenAdded >= targetBatsmen) break;
    if (tryAdd(p)) batsmenAdded++;
  }

  // 1c. Pick 2 all-rounders (versatile depth)
  let arAdded = 0;
  const targetAR = Math.min(2, byRole['All-Rounder'].length);
  for (const p of byRole['All-Rounder']) {
    if (arAdded >= targetAR) break;
    if (tryAdd(p)) arAdded++;
  }

  // 1d. Pick bowlers with bowling variety enforcement
  const paceBowlers = byRole.Bowler.filter(p => getBowlingType(p) === 'pace' && !isInXI(p));
  const spinBowlers = byRole.Bowler.filter(p => getBowlingType(p) === 'spin' && !isInXI(p));

  // Count existing pace/spin from AR & WK already in XI
  const xiPaceCount = xi.filter(p => getBowlingType(p) === 'pace').length;
  const xiSpinCount = xi.filter(p => getBowlingType(p) === 'spin').length;

  // Ensure at least 2 pacers total (death overs specialists)
  let paceNeeded = Math.max(0, 2 - xiPaceCount);
  for (const p of paceBowlers) {
    if (paceNeeded <= 0) break;
    if (tryAdd(p)) paceNeeded--;
  }

  // Ensure at least 1 spinner total (mystery/variety)
  let spinNeeded = Math.max(0, 1 - xiSpinCount);
  for (const p of spinBowlers) {
    if (spinNeeded <= 0) break;
    if (tryAdd(p)) spinNeeded--;
  }

  // Fill remaining bowling slots with best available bowlers
  for (const p of byRole.Bowler) {
    if (xi.length >= 11) break;
    tryAdd(p);
  }

  // ──── STEP 2: Fill any remaining spots with best available ────
  if (xi.length < 11) {
    const remaining = players.filter(p => !isInXI(p)).sort((a, b) => b.xiScore - a.xiScore);
    for (const p of remaining) {
      if (xi.length >= 11) break;
      tryAdd(p);
    }
  }

  // ──── STEP 3: If overseas limit blocked additions, add domestic players ────
  if (xi.length < 11) {
    const domesticRemaining = players
      .filter(p => !isInXI(p) && !p.isOverseas)
      .sort((a, b) => b.xiScore - a.xiScore);
    for (const p of domesticRemaining) {
      if (xi.length >= 11) break;
      xi.push(p);
      xiIds.add(pid(p));
    }
  }

  // ──── STEP 4: Optimize — swap weaker XI members for stronger alternatives ────
  const outsideXI = players.filter(p => !isInXI(p)).sort((a, b) => b.xiScore - a.xiScore);

  for (const candidate of outsideXI) {
    if (xi.length < 11) break;

    // Find weakest XI player of the same role
    const sameRole = xi
      .filter(p => p.role === candidate.role)
      .sort((a, b) => a.xiScore - b.xiScore);

    if (sameRole.length === 0) continue;

    const weakest = sameRole[0];
    if (candidate.xiScore <= weakest.xiScore) continue;

    // Check overseas constraint after swap
    const newOverseas = overseasInXI() - (weakest.isOverseas ? 1 : 0) + (candidate.isOverseas ? 1 : 0);
    if (newOverseas > MAX_OVERSEAS) continue;

    // Protect bowling variety
    const weakBowl = getBowlingType(weakest);
    const candBowl = getBowlingType(candidate);
    if (weakBowl === 'pace') {
      const paceLeft = xi.filter(p => pid(p) !== pid(weakest) && getBowlingType(p) === 'pace').length;
      if (paceLeft < 2 && candBowl !== 'pace') continue;
    }
    if (weakBowl === 'spin') {
      const spinLeft = xi.filter(p => pid(p) !== pid(weakest) && getBowlingType(p) === 'spin').length;
      if (spinLeft < 1 && candBowl !== 'spin') continue;
    }

    // Perform swap
    const idx = xi.findIndex(p => pid(p) === pid(weakest));
    xiIds.delete(pid(weakest));
    xi[idx] = candidate;
    xiIds.add(pid(candidate));
  }

  return sortByBattingOrder(xi.slice(0, 11));
}

/**
 * Sort the XI into a realistic IPL batting order:
 * 1-2: Explosive openers (high SR)
 * 3-4: Anchor batsmen (high avg)
 * 5: WK
 * 6-7: All-rounders
 * 8-11: Bowlers (spinners then pacers)
 */
function sortByBattingOrder(xi) {
  const wk = xi.filter(p => p.role === 'Wicketkeeper');
  const bat = xi.filter(p => p.role === 'Batsman');
  const ar = xi.filter(p => p.role === 'All-Rounder');
  const bowl = xi.filter(p => p.role === 'Bowler');

  // Batsmen: explosive first (high SR)
  bat.sort((a, b) => (b.stats?.strikeRate || 0) - (a.stats?.strikeRate || 0));

  // All-rounders: better batsmen first
  ar.sort((a, b) => (b.stats?.battingAvg || 0) - (a.stats?.battingAvg || 0));

  // Bowlers: spinners before pacers
  bowl.sort((a, b) => {
    const aType = getBowlingType(a);
    const bType = getBowlingType(b);
    if (aType === 'spin' && bType === 'pace') return -1;
    if (aType === 'pace' && bType === 'spin') return 1;
    return (b.stats?.wickets || 0) - (a.stats?.wickets || 0);
  });

  const order = [];
  order.push(...bat.splice(0, 2));   // 1-2: Openers
  order.push(...wk.splice(0, 1));    // 3: WK
  order.push(...bat);                // 4-5: Anchors
  order.push(...wk);                 // Remaining WK
  order.push(...ar);                 // 6-7: All-rounders
  order.push(...bowl);               // 8-11: Bowlers
  return order;
}

export function evaluateTeams(lobby, auction) {
  const results = [];

  for (const team of lobby.teams) {
    const starPower = calcStarPower(team, auction.soldPlayers);
    const squadBalance = calcSquadBalance(team);
    const overseasMix = calcOverseasMix(team, lobby.settings);
    const budgetEfficiency = calcBudgetEfficiency(team, auction.soldPlayers);
    const battingStrength = calcBattingStrength(team);
    const bowlingStrength = calcBowlingStrength(team);

    const totalScore = starPower + squadBalance + overseasMix +
                       budgetEfficiency + battingStrength + bowlingStrength;

    const bestXI = generateBestXI(team);

    results.push({
      userId: team.user?._id || team.user || team._id,
      username: team.user?.username || (team.isAI ? 'AI System' : 'Unknown'),
      teamName: team.teamName,
      teamColor: team.teamColor,
      totalScore: Math.round(totalScore),
      breakdown: {
        starPower: { score: starPower, max: 25 },
        squadBalance: { score: squadBalance, max: 20 },
        overseasMix: { score: overseasMix, max: 10 },
        budgetEfficiency: { score: budgetEfficiency, max: 15 },
        battingStrength: { score: battingStrength, max: 15 },
        bowlingStrength: { score: bowlingStrength, max: 15 }
      },
      playerCount: (team.players || []).length,
      budgetRemaining: team.budget,
      budgetSpent: 10000 - team.budget,
      overseasCount: team.overseasCount || (team.players || []).filter(p => p.isOverseas).length,
      bestXI
    });
  }

  // Sort by total score descending
  results.sort((a, b) => b.totalScore - a.totalScore);

  // Assign ranks
  results.forEach((r, i) => {
    r.rank = i + 1;
  });

  return {
    rankings: results,
    bestTeam: results[0] || null,
    averageScore: results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.totalScore, 0) / results.length)
      : 0
  };
}
