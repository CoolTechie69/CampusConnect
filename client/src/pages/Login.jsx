import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import hitamLogo from '../assets/hitam-logo.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-10 md:grid-cols-2 md:items-center">
        <div className="hidden md:block">
          <h1 className="flex items-center gap-3 text-5xl font-bold leading-tight">
            <img
              src={hitamLogo}
              alt="HITAM"
              className="h-14 w-14 rounded-xl ring-1 ring-green/30"
            />
            <span>
              <span className="text-green glow-text">Campus</span>Connect
            </span>
          </h1>
          <p className="mt-4 text-lg text-text-dim">
            A college-only peer help platform that matches you to the right helper based on academic
            relevance and urgency — not popularity.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-text-dim">
            <li className="flex items-start gap-2">
              <span className="text-green">▸</span> Post structured help requests for your projects
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green">▸</span> Get matched with peers who know your tech stack
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green">▸</span> Earn reputation and badges for mentoring others
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green">▸</span> No followers. No feeds. No hype. Just help.
            </li>
          </ul>
        </div>

        <div className="card-surface rounded-2xl p-8">
          <h2 className="text-2xl font-semibold">Welcome back</h2>
          <p className="mt-1 text-sm text-text-dim">Sign in with your college email</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-dim">College Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@hitam.org"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-text outline-none transition focus:border-green"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-dim">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-text outline-none transition focus:border-green"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green py-2.5 font-semibold text-bg transition hover:bg-green-bright disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-dim">
            New here?{' '}
            <Link to="/signup" className="font-medium text-green hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
