import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import { StatusPill, UrgencyPill } from '../components/Pills';
import { formatTime, timeAgo } from '../utils';

export default function Chats() {
  const { id } = useParams();
  const activeId = id ? Number(id) : null;
  const { user, refreshUser } = useAuth();
  const { socket, notifications } = useSocket();
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const loadChats = useCallback(
    () => api.get('/chats').then((res) => setChats(res.data.chats)),
    []
  );

  useEffect(() => {
    loadChats().finally(() => setLoadingList(false));
  }, [loadChats]);

  // A message on any other conversation arrives as a notification — refresh previews.
  useEffect(() => {
    if (notifications.length) loadChats();
  }, [notifications.length, loadChats]);

  useEffect(() => {
    if (!activeId) {
      setThread(null);
      setMessages([]);
      return;
    }
    setLoadingThread(true);
    setError('');
    Promise.all([api.get(`/requests/${activeId}`), api.get(`/requests/${activeId}/messages`)])
      .then(([reqRes, msgRes]) => {
        setThread(reqRes.data);
        setMessages(msgRes.data.messages);
      })
      .catch(() => setError('Could not open this conversation.'))
      .finally(() => setLoadingThread(false));
  }, [activeId]);

  useEffect(() => {
    if (!socket || !activeId) return;
    socket.emit('join_request', activeId);

    const onMessage = (m) => {
      if (m.requestId === activeId) setMessages((prev) => [...prev, m]);
      loadChats();
    };
    const onUpdate = () => {
      api.get(`/requests/${activeId}`).then((res) => setThread(res.data));
      loadChats();
    };

    socket.on('new_message', onMessage);
    socket.on('request_updated', onUpdate);
    return () => {
      socket.emit('leave_request', activeId);
      socket.off('new_message', onMessage);
      socket.off('request_updated', onUpdate);
    };
  }, [socket, activeId, loadChats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setDraft('');
    try {
      await api.post(`/requests/${activeId}/messages`, { content });
      loadChats();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send message');
      setDraft(content);
    }
  }

  async function markResolved() {
    try {
      await api.post(`/requests/${activeId}/resolve`);
      const res = await api.get(`/requests/${activeId}`);
      setThread(res.data);
      await refreshUser();
      loadChats();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resolve request');
    }
  }

  const isRequester = thread && thread.author.id === user.id;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Chats</h1>
        <p className="text-sm text-text-dim">
          Your connected help conversations. One thread per request, so discussion stays focused.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside
          className={`card-surface overflow-hidden rounded-2xl ${
            activeId ? 'hidden lg:block' : ''
          }`}
        >
          <div className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-dim">
            Conversations
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {loadingList ? (
              <LoadingSpinner label="Loading chats…" />
            ) : chats.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-text-dim">No conversations yet.</p>
                <Link to="/" className="mt-2 inline-block text-sm font-medium text-green hover:underline">
                  Find a request to connect on →
                </Link>
              </div>
            ) : (
              chats.map((c) => (
                <button
                  key={c.requestId}
                  onClick={() => navigate(`/chats/${c.requestId}`)}
                  className={`flex w-full gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors ${
                    c.requestId === activeId ? 'bg-green/10' : 'hover:bg-surface-2'
                  }`}
                >
                  <Avatar name={c.other.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium text-text">{c.other.name}</span>
                      <span className="shrink-0 text-[11px] text-text-dim">
                        {timeAgo(c.lastActivity)}
                      </span>
                    </div>
                    <div className="truncate text-xs text-text-dim">{c.title}</div>
                    <div className="mt-0.5 truncate text-xs text-text-dim/80">
                      {c.lastMessage
                        ? `${c.lastMessage.senderId === user.id ? 'You: ' : ''}${c.lastMessage.content}`
                        : 'No messages yet — say hi'}
                    </div>
                  </div>
                  {c.status === 'resolved' && (
                    <span className="self-center text-xs text-green">✓</span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="card-surface flex h-[70vh] flex-col overflow-hidden rounded-2xl">
          {!activeId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
              <div className="text-3xl opacity-60">💬</div>
              <p className="text-text-dim">Select a conversation to start chatting.</p>
              <p className="max-w-sm text-xs text-text-dim/70">
                When you connect on a request, it appears here as a private thread between you and
                the other student.
              </p>
            </div>
          ) : loadingThread ? (
            <LoadingSpinner label="Opening conversation…" />
          ) : !thread ? (
            <div className="flex flex-1 items-center justify-center text-text-dim">
              {error || 'Conversation not found.'}
            </div>
          ) : (
            <>
              <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    onClick={() => navigate('/chats')}
                    className="rounded-lg px-2 py-1 text-text-dim hover:text-green lg:hidden"
                    aria-label="Back to conversations"
                  >
                    ←
                  </button>
                  <Avatar name={(isRequester ? thread.helper : thread.author)?.name || '?'} size={38} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-text">
                      {(isRequester ? thread.helper : thread.author)?.name}
                    </div>
                    <Link
                      to={`/requests/${thread.request.id}`}
                      className="block truncate text-xs text-text-dim hover:text-green"
                    >
                      {thread.request.title} ↗
                    </Link>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <UrgencyPill urgency={thread.request.urgency} />
                  <StatusPill status={thread.request.status} />
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.length === 0 && (
                  <div className="py-10 text-center text-sm text-text-dim">
                    No messages yet. Describe the problem in detail to get moving quickly.
                  </div>
                )}
                {messages.map((m) => {
                  const mine = m.sender.id === user.id;
                  return (
                    <div key={m.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                      <Avatar name={m.sender.name} size={28} />
                      <div className={`max-w-[75%] ${mine ? 'text-right' : ''}`}>
                        <div
                          className={`rounded-2xl border px-3.5 py-2 text-sm ${
                            mine
                              ? 'border-green/25 bg-green/15 text-text'
                              : 'border-border bg-surface-2 text-text'
                          }`}
                        >
                          {m.content}
                        </div>
                        <div className="mt-1 text-[11px] text-text-dim">{formatTime(m.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {error && (
                <div className="border-t border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
                  {error}
                </div>
              )}

              {thread.request.status === 'in_progress' ? (
                <div className="border-t border-border p-3">
                  {isRequester && (
                    <button
                      onClick={markResolved}
                      className="mb-2 w-full rounded-lg border border-green/40 bg-green/10 py-2 text-sm font-medium text-green transition hover:bg-green/20"
                    >
                      ✓ Mark this request as resolved
                    </button>
                  )}
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type your message…"
                      className="flex-1 rounded-lg border border-border bg-bg px-3 py-2.5 text-text outline-none transition focus:border-green"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-green px-5 py-2.5 font-semibold text-bg transition hover:bg-green-bright"
                    >
                      Send
                    </button>
                  </form>
                </div>
              ) : (
                <div className="border-t border-border p-4 text-center text-sm text-text-dim">
                  This request is resolved — the thread is archived.
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
