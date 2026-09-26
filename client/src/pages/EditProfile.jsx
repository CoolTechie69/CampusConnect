import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import TagInput from '../components/TagInput';

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

export default function EditProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState(user.skills);
  const [bio, setBio] = useState(user.bio || '');
  const [availability, setAvailability] = useState(user.availability);
  const [department, setDepartment] = useState(user.department);
  const [year, setYear] = useState(user.year);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch('/users/me', { skills, bio, availability, department, year });
      setUser(res.data.user);
      setSaved(true);
      setTimeout(() => navigate(`/profile/${user.id}`), 700);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-text outline-none transition focus:border-green';

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Edit Profile</h1>
      <p className="mt-1 text-sm text-text-dim">
        Your skills and availability directly affect which requests you get matched to.
      </p>

      <form onSubmit={handleSubmit} className="card-surface mt-6 space-y-5 rounded-2xl p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-dim">Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Third year CS student. I mostly work with React and Python."
            className={`${inputClass} resize-y`}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-dim">Skills</label>
          <TagInput tags={skills} setTags={setSkills} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-dim">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
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
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputClass}>
              {[1, 2, 3, 4].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-text-dim">Availability</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'available', label: '● Available to help' },
              { value: 'busy', label: '● Busy right now' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAvailability(opt.value)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  availability === opt.value
                    ? 'border-green/50 bg-green/10 text-green'
                    : 'border-border text-text-dim hover:text-text'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-dim">
            Marking yourself busy removes you from match suggestions until you're free.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-green py-2.5 font-semibold text-bg transition hover:bg-green-bright disabled:opacity-50"
          >
            {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-border px-5 py-2.5 text-text-dim transition hover:text-text"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
