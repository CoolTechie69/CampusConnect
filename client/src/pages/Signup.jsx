import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TagInput from '../components/TagInput';
import hitamLogo from '../assets/hitam-logo.png';

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Electrical',
  'Mechanical',
  'Civil',
  'AI & Data Science',
  'Other',
];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Computer Science',
    year: 1,
  });
  const [skills, setSkills] = useState([]);
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
      await signup({ ...form, year: Number(form.year), skills });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-text outline-none transition focus:border-green';

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card-surface w-full max-w-lg rounded-2xl p-8">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold">
          <img src={hitamLogo} alt="HITAM" className="h-9 w-9 rounded-lg ring-1 ring-green/30" />
          <span>
            Join <span className="text-green glow-text">CampusConnect</span>
          </span>
        </h1>
        <p className="mt-1 text-sm text-text-dim">
          Open to <span className="text-green">@hitam.org</span> students only. Your department and
          year help us match you.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-dim">Full Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Aman Sharma"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-dim">College Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="you@hitam.org"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-dim">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="At least 6 characters"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-dim">Department</label>
              <select
                value={form.department}
                onChange={(e) => update('department', e.target.value)}
                className={inputClass}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-dim">Year</label>
              <select
                value={form.year}
                onChange={(e) => update('year', e.target.value)}
                className={inputClass}
              >
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-dim">
              Your Skills <span className="text-text-dim/60">(used for matching)</span>
            </label>
            <TagInput tags={skills} setTags={setSkills} />
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
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-dim">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-green hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
