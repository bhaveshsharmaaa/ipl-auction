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
