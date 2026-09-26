export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-dim">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-green" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
