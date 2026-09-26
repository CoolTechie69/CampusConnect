function colorFromName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 30%)`;
}

export default function Avatar({ name, size = 40 }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-green/30 font-semibold text-green-bright"
      style={{ width: size, height: size, fontSize: size * 0.4, background: colorFromName(name || '?') }}
    >
      {initials || '?'}
    </div>
  );
}
