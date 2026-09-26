const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

const router = express.Router();

// Throttle credential guessing. Successful logins don't count toward the limit.
// Limits are overridable so test runs aren't locked out; defaults are the production values.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_LOGIN_MAX || 10),
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_SIGNUP_MAX || 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many accounts created from this network. Please try again later.' },
});

// Comma-separated list of allowed college email domains, e.g. "vit.ac.in,college.edu"
// Leave unset in dev to accept any well-formed email address.
const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || '')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

function isCollegeEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  if (ALLOWED_DOMAINS.length === 0) return true;
  const domain = email.split('@')[1].toLowerCase();
  return ALLOWED_DOMAINS.some((d) => domain === d || domain.endsWith('.' + d));
}

function toPublicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    department: u.department,
    year: u.year,
    skills: JSON.parse(u.skills),
    bio: u.bio,
    availability: u.availability,
    reputationPoints: u.reputation_points,
    resolvedCount: u.resolved_count,
    badges: JSON.parse(u.badges),
    createdAt: u.created_at,
  };
}

router.post('/signup', signupLimiter, async (req, res) => {
  const { name, email, password, department, year, skills } = req.body || {};

  if (!name || !email || !password || !department || !year) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!isCollegeEmail(email)) {
    return res.status(400).json({
      error: ALLOWED_DOMAINS.length
        ? `Please sign up with your college email (@${ALLOWED_DOMAINS[0]})`
        : 'Please use a valid college email address',
    });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await db.get('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const skillsJson = JSON.stringify(Array.isArray(skills) ? skills : []);

  const user = await db.get(
    `INSERT INTO users (name, email, password_hash, department, year, skills)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, normalizedEmail, passwordHash, department, Number(year), skillsJson]
  );

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: toPublicUser(user) });
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  const user = await db.get('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: toPublicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await db.get('SELECT * FROM users WHERE id = $1', [req.userId]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: toPublicUser(user) });
});

module.exports = { router, toPublicUser };
