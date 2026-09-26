import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { HELP_TYPES, URGENCY_LEVELS } from '../api';
import TagInput from '../components/TagInput';

export default function NewRequest() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    helpType: 'debugging',
    urgency: 'medium',
  });
  const [techStack, setTechStack] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/requests', { ...form, techStack });
      navigate(`/requests/${res.data.request.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not post request');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-text outline-none transition focus:border-green';

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Post a Help Request</h1>
      <p className="mt-1 text-sm text-text-dim">
        Be specific. Structured requests get matched to the right helper faster.
      </p>

      <form onSubmit={handleSubmit} className="card-surface mt-6 space-y-5 rounded-2xl p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-dim">Project / Problem Title</label>
          <input
            required
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="React app crashes on route change"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-dim">What do you need help with?</label>
          <textarea
            required
            rows={6}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Describe what you tried, the error you're seeing, and what you expected to happen."
            className={`${inputClass} resize-y`}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-dim">Tech Stack</label>
          <TagInput tags={techStack} setTags={setTechStack} placeholder="React, Node.js, MongoDB…" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-text-dim">Type of Help</label>
          <div className="grid grid-cols-2 gap-2">
            {HELP_TYPES.map((h) => (
              <button
                key={h.value}
                type="button"
                onClick={() => update('helpType', h.value)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  form.helpType === h.value
                    ? 'border-green/50 bg-green/10 text-green'
                    : 'border-border text-text-dim hover:text-text'
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-text-dim">Urgency</label>
          <div className="grid grid-cols-3 gap-2">
            {URGENCY_LEVELS.map((u) => (
              <button
                key={u.value}
                type="button"
                onClick={() => update('urgency', u.value)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  form.urgency === u.value
                    ? 'border-green/50 bg-green/10 text-green'
                    : 'border-border text-text-dim hover:text-text'
                }`}
              >
                {u.label.split(' — ')[0]}
              </button>
            ))}
          </div>
          {form.urgency === 'high' && (
            <p className="mt-2 text-xs text-amber-400">
              High urgency requests are pinned to the top of the feed. Use it when a deadline is near.
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-green py-2.5 font-semibold text-bg transition hover:bg-green-bright disabled:opacity-50"
          >
            {loading ? 'Posting…' : 'Post Request & Find Helpers'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-lg border border-border px-5 py-2.5 text-text-dim transition hover:text-text"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
