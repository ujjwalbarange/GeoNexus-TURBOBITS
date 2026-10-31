/**
 * Utility Formatters for Traffic Control Dashboard
 */

export function formatTimeAgo(date) {
  if (!date) return 'Never';
  const now = new Date();
  const diffSec = Math.floor((now - new Date(date)) / 1000);

  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  return `${diffHrs}h ago`;
}

export function formatTimestamp(date) {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export function formatSpeed(speedKmH) {
  if (speedKmH === null || speedKmH === undefined) return 'N/A';
  return `${Math.round(speedKmH)} km/h`;
}
