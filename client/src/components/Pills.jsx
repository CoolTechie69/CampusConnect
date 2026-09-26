import { helpTypeLabel, urgencyLabel } from '../api';

export function UrgencyPill({ urgency }) {
  const styles = {
    high: 'bg-red-500/10 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    low: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  };
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${styles[urgency] || styles.medium}`}>
      {urgencyLabel(urgency)}
    </span>
  );
}

export function HelpTypePill({ helpType }) {
  return (
    <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-dim">
      {helpTypeLabel(helpType)}
    </span>
  );
}

export function StatusPill({ status }) {
  const styles = {
    open: 'bg-green/10 text-green border-green/30',
    in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    resolved: 'bg-surface-2 text-text-dim border-border',
  };
  const labels = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
