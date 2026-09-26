const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { toPublicUser } = require('./auth');

const router = express.Router();

router.get('/leaderboard', async (req, res) => {
  const rows = await db.all(
    `SELECT * FROM users ORDER BY reputation_points DESC, resolved_count DESC LIMIT 50`
  );
  res.json({ users: rows.map(toPublicUser) });
});

router.patch('/me', requireAuth, async (req, res) => {
  const { skills, bio, availability, department, year } = req.body || {};
  const current = await db.get('SELECT * FROM users WHERE id = $1', [req.userId]);
  if (!current) return res.status(404).json({ error: 'User not found' });

  const updated = {
    skills: skills !== undefined ? JSON.stringify(skills) : current.skills,
    bio: bio !== undefined ? bio : current.bio,
    availability: availability !== undefined ? availability : current.availability,
    department: department !== undefined ? department : current.department,
    year: year !== undefined ? Number(year) : current.year,
  };

  if (updated.availability && !['available', 'busy'].includes(updated.availability)) {
    return res.status(400).json({ error: 'Invalid availability value' });
  }

  const user = await db.get(
    `UPDATE users SET skills = $1, bio = $2, availability = $3, department = $4, year = $5
     WHERE id = $6 RETURNING *`,
    [updated.skills, updated.bio, updated.availability, updated.department, updated.year, req.userId]
  );

  res.json({ user: toPublicUser(user) });
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid user id' });

  const user = await db.get('SELECT * FROM users WHERE id = $1', [id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: toPublicUser(user) });
});

module.exports = router;
