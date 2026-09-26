import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Leaderboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/users/leaderboard')
      .then((res) => setUsers(res.data.users))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Loading leaderboard…" />;

  const medal = (i) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Top Helpers</h1>
      <p className="mt-1 text-sm text-text-dim">
        Recognition for students who consistently help their peers. This does not affect matching —
        matches are always scored per request.
      </p>

      <div className="mt-6 space-y-2">
        {users.map((u, i) => (
          <Link
            key={u.id}
            to={`/profile/${u.id}`}
            className={`card-surface flex items-center gap-4 rounded-xl p-4 transition hover:border-green/30 ${
              u.id === user.id ? 'border-green/40' : ''
            }`}
          >
            <div className="w-10 text-center text-lg font-bold text-text-dim">{medal(i)}</div>
            <Avatar name={u.name} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-text">{u.name}</span>
                {u.id === user.id && (
                  <span className="rounded-md bg-green/15 px-1.5 py-0.5 text-[10px] font-semibold text-green">
                    YOU
                  </span>
                )}
              </div>
              <div className="text-xs text-text-dim">
                {u.department} · Year {u.year}
              </div>
              {u.badges.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {u.badges.slice(0, 3).map((b) => (
                    <Badge key={b} id={b} />
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green">{u.reputationPoints}</div>
              <div className="text-[11px] text-text-dim">{u.resolvedCount} helped</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
