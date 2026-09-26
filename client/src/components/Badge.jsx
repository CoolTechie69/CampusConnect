const BADGE_META = {
  first_help: { label: 'First Help', icon: '🌱' },
  debugging_pro: { label: 'Debugging Pro', icon: '🛠️' },
  top_helper: { label: 'Top Helper', icon: '⭐' },
  campus_legend: { label: 'Campus Legend', icon: '👑' },
};

export default function Badge({ id }) {
  const meta = BADGE_META[id] || { label: id, icon: '🏅' };
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-green/40 bg-green/10 px-2.5 py-1 text-xs font-medium text-green">
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
}
