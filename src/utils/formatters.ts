export function formatLastContacted(isoString?: string | null): string {
  if (!isoString) return 'Never contacted';
  
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Invalid date';

  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (diffInDays === 0) return `Today at ${timeStr}`;
  if (diffInDays === 1) return `Yesterday at ${timeStr}`;
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
