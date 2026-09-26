import { useState } from 'react';

const SUGGESTIONS = [
  'C', 'C++', 'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js',
  'Express', 'MongoDB', 'SQL', 'Machine Learning', 'Deep Learning', 'Data Science',
  'Android', 'Flutter', 'Django', 'Flask', 'HTML/CSS', 'Git', 'DSA', 'Arduino',
  'Figma', 'Cloud', 'Docker',
];

export default function TagInput({ tags, setTags, placeholder = 'Type a skill and press Enter' }) {
  const [input, setInput] = useState('');

  function addTag(value) {
    const v = value.trim();
    if (!v) return;
    if (tags.some((t) => t.toLowerCase() === v.toLowerCase())) return;
    setTags([...tags, v]);
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length) {
      setTags(tags.slice(0, -1));
    }
  }

  const available = SUGGESTIONS.filter(
    (s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())
  ).slice(0, 10);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-bg px-2 py-2 focus-within:border-green">
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 rounded-md border border-green/30 bg-green/10 px-2 py-0.5 text-sm text-green"
          >
            {t}
            <button
              type="button"
              onClick={() => setTags(tags.filter((x) => x !== t))}
              className="text-green/70 hover:text-green"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="min-w-[140px] flex-1 bg-transparent px-1 py-0.5 text-text outline-none"
        />
      </div>
      {available.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {available.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs text-text-dim transition hover:border-green/40 hover:text-green"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
