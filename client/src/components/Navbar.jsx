import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api';
import Avatar from './Avatar';

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
    isActive ? 'text-green bg-green/10' : 'text-text-dim hover:text-text hover:bg-surface-2'
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, setNotifications } = useSocket();
  const [open, setOpen] = useState(false);
  const [serverNotifs, setServerNotifs] = useState([]);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    api.get('/notifications').then((res) => setServerNotifs(res.data.notifications));
  }, [user]);

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const allNotifs = [...notifications, ...serverNotifs].slice(0, 15);
  const unreadCount = notifications.length + serverNotifs.filter((n) => !n.read).length;

  // Live notifications are also persisted server-side, so refetch before clearing
  // them locally — otherwise they'd vanish from the dropdown the moment it opens.
  async function openAndMarkRead() {
    const res = await api.get('/notifications');
    setServerNotifs(res.data.notifications);
    setNotifications([]);
    await api.post('/notifications/read-all');
  }

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-green glow-text">Campus</span>
          <span className="text-xl font-bold tracking-tight text-text">Connect</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            Feed
          </NavLink>
          <NavLink to="/requests/new" className={navLinkClass}>
            Ask for Help
          </NavLink>
          <NavLink to="/chats" className={navLinkClass}>
            Chats
          </NavLink>
          <NavLink to="/leaderboard" className={navLinkClass}>
            Leaderboard
          </NavLink>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                setOpen((o) => !o);
                if (!open) openAndMarkRead();
              }}
              className="relative rounded-lg p-2 text-text-dim hover:bg-surface-2 hover:text-text"
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green text-[10px] font-bold text-bg">
                  {unreadCount}
                </span>
              )}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-surface p-2 shadow-xl">
                <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-text-dim">
                  Notifications
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {allNotifs.length === 0 && (
                    <div className="px-2 py-6 text-center text-sm text-text-dim">No notifications yet</div>
                  )}
                  {allNotifs.map((n, i) => (
                    <button
                      key={n.id || i}
                      onClick={() => {
                        setOpen(false);
                        if (n.requestId) navigate(`/requests/${n.requestId}`);
                      }}
                      className="block w-full rounded-lg px-2 py-2 text-left text-sm text-text hover:bg-surface-2"
                    >
                      {n.message}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to={`/profile/${user.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-surface-2">
            <Avatar name={user.name} size={32} />
            <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
          </Link>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-dim hover:border-green/40 hover:text-green"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1 border-t border-border px-4 py-1 md:hidden">
        <NavLink to="/" end className={navLinkClass}>
          Feed
        </NavLink>
        <NavLink to="/requests/new" className={navLinkClass}>
          Ask
        </NavLink>
        <NavLink to="/chats" className={navLinkClass}>
          Chats
        </NavLink>
        <NavLink to="/leaderboard" className={navLinkClass}>
          Leaders
        </NavLink>
      </div>
    </nav>
  );
}
