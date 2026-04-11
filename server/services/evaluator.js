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

function generateBestXI(team) {
  const players = team.players || [];
  if (players.length < 11) return players.map(p => p._id || p);

  // Pick best XI: 1-2 WK, 4-5 BAT, 3-4 BOWL, 1-2 AR
  const wk = players.filter(p => p.role === 'Wicketkeeper')
    .sort((a, b) => (b.stats?.battingAvg || 0) - (a.stats?.battingAvg || 0));
  const bat = players.filter(p => p.role === 'Batsman')
    .sort((a, b) => (b.stats?.battingAvg || 0) - (a.stats?.battingAvg || 0));
  const ar = players.filter(p => p.role === 'All-Rounder')
    .sort((a, b) => ((b.stats?.battingAvg || 0) + (b.stats?.wickets || 0)) -
                     ((a.stats?.battingAvg || 0) + (a.stats?.wickets || 0)));
  const bowl = players.filter(p => p.role === 'Bowler')
    .sort((a, b) => (b.stats?.wickets || 0) - (a.stats?.wickets || 0));

  const xi = [];
  xi.push(...wk.slice(0, 1));
  xi.push(...bat.slice(0, 5));
  xi.push(...ar.slice(0, 2));
  xi.push(...bowl.slice(0, 3));

  // Fill remaining spots
  const remaining = players.filter(p => !xi.includes(p));
  while (xi.length < 11 && remaining.length > 0) {
    xi.push(remaining.shift());
  }

  return xi.slice(0, 11);
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
