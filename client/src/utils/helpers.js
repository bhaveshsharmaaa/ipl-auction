/**
 * Format a price in lakhs to a friendly string
 * e.g., 200 → "₹2.00 Cr", 50 → "₹50 L"
 */
export function formatPrice(lakhs) {
  if (lakhs >= 100) {
    return `₹${(lakhs / 100).toFixed(2)} Cr`;
  }
  return `₹${lakhs} L`;
}

/**
 * Format a number with commas
 */
export function formatNumber(num) {
  if (num == null) return '0';
  return num.toLocaleString('en-IN');
}

/**
 * Get role color
 */
export function getRoleColor(role) {
  switch (role) {
    case 'Batsman': return '#60a5fa';
    case 'Bowler': return '#f87171';
    case 'All-Rounder': return '#4ade80';
    case 'Wicketkeeper': return '#fbbf24';
    default: return '#a0a0c0';
  }
}

/**
 * Get role emoji
 */
export function getRoleEmoji(role) {
  switch (role) {
    case 'Batsman': return '🏏';
    case 'Bowler': return '☄️';
    case 'All-Rounder': return '⭐';
    case 'Wicketkeeper': return '🧤';
    default: return '🏏';
  }
}

/**
 * Get tier badge color class
 */
export function getTierBadgeClass(tier) {
  switch (tier) {
    case 'Legend': return 'badge-legend';
    case 'Marquee': return 'badge-gold';
    case 'A': return 'badge-purple';
    case 'B': return 'badge-blue';
    case 'C': return 'badge-green';
    default: return 'badge-blue';
  }
}

/**
 * Get initial for avatar
 */
export function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : '?';
}

/**
 * Team colors palette
 */
export const TEAM_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F0B27A', '#76D7C4', '#F1948A', '#82E0AA', '#D7BDE2'
];

/**
 * Convert a date to a human-friendly relative time string
 * e.g., "just now", "5 min ago", "2 hrs ago", "3 days ago"
 */
export function timeAgo(date) {
  if (!date) return '';
  const now = Date.now();
  const past = new Date(date).getTime();
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
