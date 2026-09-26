// Timestamps arrive as ISO 8601 with an explicit timezone.
export function parseServerDate(iso) {
  return new Date(iso);
}

export function timeAgo(iso) {
  const diffMs = Date.now() - parseServerDate(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatTime(iso) {
  return parseServerDate(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
