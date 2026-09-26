import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import { UrgencyPill, HelpTypePill, StatusPill } from './Pills';
import { timeAgo } from '../utils';

export default function RequestCard({ request }) {
  return (
    <Link
      to={`/requests/${request.id}`}
      className="card-surface card-interactive block rounded-xl p-4 hover:-translate-y-0.5 hover:border-green/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Avatar name={request.author.name} size={36} />
          <div>
            <div className="text-sm font-medium text-text">{request.author.name}</div>
            <div className="text-xs text-text-dim">
              {request.author.department} · Year {request.author.year}
            </div>
          </div>
        </div>
        <div className="text-xs text-text-dim">{timeAgo(request.createdAt)}</div>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-text">{request.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-text-dim">{request.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {request.techStack.map((t) => (
          <span key={t} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-text-dim">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusPill status={request.status} />
        <UrgencyPill urgency={request.urgency} />
        <HelpTypePill helpType={request.helpType} />
        {request.myMatchScore !== null && request.myMatchScore !== undefined && (
          <span className="ml-auto rounded-full border border-green/40 bg-green/10 px-2.5 py-1 text-xs font-semibold text-green">
            {request.myMatchScore}% match for you
          </span>
        )}
      </div>
    </Link>
  );
}
