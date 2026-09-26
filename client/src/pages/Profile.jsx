import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import RequestCard from '../components/RequestCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/users/${id}`), api.get('/requests')])
      .then(([userRes, reqRes]) => {
        setProfile(userRes.data.user);
        setRequests(
          reqRes.data.requests.filter(
            (r) => r.userId === Number(id) || r.acceptedHelperId === Number(id)
          )
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner label="Loading profile…" />;
  if (!profile) return <div className="p-10 text-center text-text-dim">User not found.</div>;

  const isMe = me.id === profile.id;
  const posted = requests.filter((r) => r.userId === profile.id);
  const helped = requests.filter((r) => r.acceptedHelperId === profile.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="card-surface rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={profile.name} size={72} />
            <div>
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <div className="text-sm text-text-dim">
                {profile.department} · Year {profile.year}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs">
                <span
                  className={`pulse-dot ${
                    profile.availability === 'available' ? 'text-green' : 'text-amber-400'
                  }`}
                >
                  ●
                </span>
                <span className="text-text-dim">
                  {profile.availability === 'available' ? 'Available to help' : 'Currently busy'}
                </span>
              </div>
            </div>
          </div>

          {isMe && (
            <Link
              to="/profile/edit"
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-dim transition hover:border-green/40 hover:text-green"
            >
              Edit Profile
            </Link>
          )}
        </div>

        {profile.bio && <p className="mt-5 leading-relaxed text-text-dim">{profile.bio}</p>}

        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5">
          <div>
            <div className="text-2xl font-bold text-green">{profile.reputationPoints}</div>
            <div className="text-xs text-text-dim">Help Points</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green">{profile.resolvedCount}</div>
            <div className="text-xs text-text-dim">Students Helped</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green">{posted.length}</div>
            <div className="text-xs text-text-dim">Requests Posted</div>
          </div>
        </div>

        {profile.badges.length > 0 && (
          <div className="mt-5 border-t border-border pt-5">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-dim">Badges</div>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((b) => (
                <Badge key={b} id={b} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 border-t border-border pt-5">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-dim">Skills</div>
          {profile.skills.length === 0 ? (
            <p className="text-sm text-text-dim">No skills listed yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-border bg-surface-2 px-2.5 py-1 text-sm text-text-dim"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {helped.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">Mentoring Activity ({helped.length})</h2>
          <div className="space-y-3">
            {helped.map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
          </div>
        </section>
      )}

      {posted.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">Requests Posted ({posted.length})</h2>
          <div className="space-y-3">
            {posted.map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
