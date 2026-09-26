import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Avatar from '../components/Avatar';
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { UrgencyPill, HelpTypePill, StatusPill } from '../components/Pills';
import { timeAgo } from '../utils';

export default function RequestDetail() {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [invitedIds, setInvitedIds] = useState([]);
  const [error, setError] = useState('');

  const load = () =>
    api.get(`/requests/${id}`).then((res) => {
      setData(res.data);
      return res.data;
    });

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_request', Number(id));
    const onUpdate = () => load();
    socket.on('request_updated', onUpdate);

    return () => {
      socket.emit('leave_request', Number(id));
      socket.off('request_updated', onUpdate);
    };
  }, [socket, id]);

  if (loading) return <LoadingSpinner label="Loading request…" />;
  if (!data) return <div className="p-10 text-center text-text-dim">Request not found.</div>;

  const { request, author, helper, matches } = data;
  const isAuthor = user.id === author.id;
  const isHelper = helper && user.id === helper.id;
  const isParticipant = isAuthor || isHelper;

  async function handleConnect() {
    setBusy(true);
    setError('');
    try {
      await api.post(`/requests/${id}/accept`);
      navigate(`/chats/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not connect to this request');
      setBusy(false);
    }
  }

  async function handleResolve() {
    setBusy(true);
    setError('');
    try {
      await api.post(`/requests/${id}/resolve`);
      await load();
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resolve request');
    } finally {
      setBusy(false);
    }
  }

  async function handleInvite(helperId) {
    setBusy(true);
    try {
      await api.post(`/requests/${id}/invite`, { helperId });
      setInvitedIds((prev) => [...prev, helperId]);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send invite');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/" className="text-sm text-text-dim hover:text-green">
        ← Back to feed
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="card-surface rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={author.name} size={44} />
                <div>
                  <Link to={`/profile/${author.id}`} className="font-medium text-text hover:text-green">
                    {author.name}
                  </Link>
                  <div className="text-xs text-text-dim">
                    {author.department} · Year {author.year} · {timeAgo(request.createdAt)}
                  </div>
                </div>
              </div>
              <StatusPill status={request.status} />
            </div>

            <h1 className="mt-5 text-2xl font-bold">{request.title}</h1>

            <div className="mt-3 flex flex-wrap gap-2">
              <UrgencyPill urgency={request.urgency} />
              <HelpTypePill helpType={request.helpType} />
              {request.techStack.map((t) => (
                <span key={t} className="rounded-md bg-surface-2 px-2 py-1 text-xs text-text-dim">
                  {t}
                </span>
              ))}
            </div>

            <p className="mt-5 whitespace-pre-wrap leading-relaxed text-text-dim">{request.description}</p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {!isAuthor && request.status === 'open' && (
                <button
                  onClick={handleConnect}
                  disabled={busy}
                  className="rounded-lg bg-green px-5 py-2.5 font-semibold text-bg transition hover:bg-green-bright disabled:opacity-50"
                >
                  {busy ? 'Connecting…' : 'Connect'}
                </button>
              )}
              {isParticipant && request.status !== 'open' && (
                <Link
                  to={`/chats/${request.id}`}
                  className="rounded-lg bg-green px-5 py-2.5 font-semibold text-bg transition hover:bg-green-bright"
                >
                  Open chat
                </Link>
              )}
              {isAuthor && request.status === 'in_progress' && (
                <button
                  onClick={handleResolve}
                  disabled={busy}
                  className="rounded-lg bg-green px-5 py-2.5 font-semibold text-bg transition hover:bg-green-bright disabled:opacity-50"
                >
                  ✓ Mark as Resolved
                </button>
              )}
              {request.status === 'resolved' && (
                <div className="rounded-lg border border-green/30 bg-green/10 px-4 py-2.5 text-sm text-green">
                  Resolved{helper ? ` with help from ${helper.name}` : ''} 🎉
                </div>
              )}
            </div>
          </div>

        </div>

        <aside className="space-y-4">
          {helper && (
            <div className="card-surface rounded-xl p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-text-dim">Helping</div>
              <Link to={`/profile/${helper.id}`} className="mt-3 flex items-center gap-3">
                <Avatar name={helper.name} size={40} />
                <div>
                  <div className="font-medium text-text">{helper.name}</div>
                  <div className="text-xs text-text-dim">
                    {helper.department} · Year {helper.year}
                  </div>
                </div>
              </Link>
            </div>
          )}

          {request.status === 'open' && (
            <div>
              <div className="mb-3">
                <h2 className="font-semibold">Best matched helpers</h2>
                <p className="text-xs text-text-dim">
                  Ranked for this request by skills, seniority, availability and past help.
                </p>
              </div>
              {matches.length === 0 ? (
                <div className="card-surface rounded-xl p-5 text-sm text-text-dim">
                  No matching helpers available right now.
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.map((m) => (
                    <MatchCard
                      key={m.user.id}
                      match={m}
                      onInvite={isAuthor ? handleInvite : undefined}
                      inviting={busy}
                      invited={invitedIds.includes(m.user.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
