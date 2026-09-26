import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import Badge from './Badge';

export default function MatchCard({ match, onInvite, inviting, invited }) {
  const { user, score } = match;
  return (
    <div className="card-surface flex flex-col gap-3 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <Link to={`/profile/${user.id}`} className="flex items-center gap-3">
          <Avatar name={user.name} size={44} />
          <div>
            <div className="font-medium text-text">{user.name}</div>
            <div className="text-xs text-text-dim">
              {user.department} · Year {user.year}
            </div>
          </div>
        </Link>
        <div className="text-right">
          <div className="text-2xl font-bold text-green">{score}%</div>
          <div className="text-[11px] text-text-dim">match</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {user.skills.slice(0, 6).map((s) => (
          <span key={s} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-text-dim">
            {s}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-text-dim">
        <span>{user.resolvedCount} helped · {user.reputationPoints} pts</span>
        <span className={user.availability === 'available' ? 'text-green' : 'text-amber-400'}>
          ● {user.availability === 'available' ? 'Available' : 'Busy'}
        </span>
      </div>

      {user.badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {user.badges.slice(0, 3).map((b) => (
            <Badge key={b} id={b} />
          ))}
        </div>
      )}

      {onInvite && (
        <button
          onClick={() => onInvite(user.id)}
          disabled={inviting || invited}
          className="mt-1 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-bg transition hover:bg-green-bright disabled:opacity-50"
        >
          {invited ? 'Invite sent ✓' : 'Invite to help'}
        </button>
      )}
    </div>
  );
}
