import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { HELP_TYPES, URGENCY_LEVELS } from '../api';
import { useAuth } from '../context/AuthContext';
import RequestCard from '../components/RequestCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';

const TABS = [
  { key: 'all', label: 'All Requests', params: {} },
  { key: 'open', label: 'Open', params: { status: 'open' } },
  { key: 'mine', label: 'My Requests', params: { mine: 'true' } },
  { key: 'helping', label: "I'm Helping", params: { mine: 'helping' } },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [helpType, setHelpType] = useState('');
  const [urgency, setUrgency] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = { ...TABS.find((t) => t.key === tab).params };
    if (helpType) params.helpType = helpType;
    if (urgency) params.urgency = urgency;

    api
      .get('/requests', { params })
      .then((res) => setRequests(res.data.requests))
      .finally(() => setLoading(false));
  }, [tab, helpType, urgency]);

  const selectClass =
    'rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-green';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Help Feed</h1>
              <p className="text-sm text-text-dim">
                Requests from your college, sorted by urgency
              </p>
            </div>
            <Link
              to="/requests/new"
              className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-bg transition hover:bg-green-bright"
            >
              + Ask for Help
            </Link>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  tab === t.key
                    ? 'bg-green/15 text-green border border-green/40'
                    : 'border border-border text-text-dim hover:text-text'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            <select value={helpType} onChange={(e) => setHelpType(e.target.value)} className={selectClass}>
              <option value="">All help types</option>
              {HELP_TYPES.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
            <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className={selectClass}>
              <option value="">All urgency</option>
              {URGENCY_LEVELS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
            {(helpType || urgency) && (
              <button
                onClick={() => {
                  setHelpType('');
                  setUrgency('');
                }}
                className="rounded-lg border border-border px-3 py-2 text-sm text-text-dim hover:text-green"
              >
                Clear
              </button>
            )}
          </div>

          {loading ? (
            <LoadingSpinner label="Loading requests…" />
          ) : requests.length === 0 ? (
            <div className="card-surface rounded-xl p-10 text-center">
              <p className="text-text-dim">No requests here yet.</p>
              <Link to="/requests/new" className="mt-3 inline-block text-sm font-medium text-green hover:underline">
                Post the first one →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <RequestCard key={r.id} request={r} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card-surface rounded-xl p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-text-dim">Your Impact</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="text-2xl font-bold text-green">{user.reputationPoints}</div>
                <div className="text-xs text-text-dim">Help points</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green">{user.resolvedCount}</div>
                <div className="text-xs text-text-dim">Students helped</div>
              </div>
            </div>
            {user.badges.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {user.badges.map((b) => (
                  <Badge key={b} id={b} />
                ))}
              </div>
            )}
            <Link
              to={`/profile/${user.id}`}
              className="mt-4 block text-sm font-medium text-green hover:underline"
            >
              View your profile →
            </Link>
          </div>

          <div className="card-surface rounded-xl p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-text-dim">Your Skills</div>
            {user.skills.length === 0 ? (
              <p className="mt-3 text-sm text-text-dim">
                Add skills so we can match you to the right requests.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {user.skills.map((s) => (
                  <span key={s} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-text-dim">
                    {s}
                  </span>
                ))}
              </div>
            )}
            <Link to="/profile/edit" className="mt-4 block text-sm font-medium text-green hover:underline">
              Edit skills & availability →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
