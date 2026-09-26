const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { toPublicUser } = require('./auth');
const { computeMatchScore } = require('../utils/match');
const { badgesForCount } = require('../utils/badges');

const router = express.Router();

const HELP_TYPES = ['debugging', 'concept', 'design_review', 'code_review'];
const URGENCY_LEVELS = ['low', 'medium', 'high'];

function toPublicRequest(r) {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    description: r.description,
    techStack: JSON.parse(r.tech_stack),
    helpType: r.help_type,
    urgency: r.urgency,
    status: r.status,
    acceptedHelperId: r.accepted_helper_id,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at,
  };
}

async function notify(app, userId, type, message, requestId) {
  await db.run(
    `INSERT INTO notifications (user_id, type, message, request_id) VALUES ($1, $2, $3, $4)`,
    [userId, type, message, requestId ?? null]
  );
  const io = app.get('io');
  if (io) io.to(`user:${userId}`).emit('notification', { type, message, requestId });
}

router.get('/', requireAuth, async (req, res) => {
  const { status, helpType, urgency, mine } = req.query;
  const clauses = [];
  const params = [];

  const addFilter = (sql, value) => {
    params.push(value);
    clauses.push(`${sql} $${params.length}`);
  };

  if (status) addFilter('status =', status);
  if (helpType) addFilter('help_type =', helpType);
  if (urgency) addFilter('urgency =', urgency);
  if (mine === 'true') addFilter('user_id =', req.userId);
  if (mine === 'helping') addFilter('accepted_helper_id =', req.userId);

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await db.all(
    `SELECT * FROM requests ${where}
     ORDER BY CASE urgency WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, created_at DESC`,
    params
  );

  // Fetch every author in one round trip rather than one query per row.
  const authorIds = [...new Set(rows.map((r) => r.user_id))];
  const authors = authorIds.length
    ? await db.all('SELECT * FROM users WHERE id = ANY($1::int[])', [authorIds])
    : [];
  const authorById = new Map(authors.map((a) => [a.id, a]));

  const requester = await db.get('SELECT * FROM users WHERE id = $1', [req.userId]);

  const enriched = rows.map((r) => {
    const author = authorById.get(r.user_id);
    let topMatchScore = null;
    if (r.status === 'open' && requester && author) {
      topMatchScore = computeMatchScore(r, requester, author.year);
      if (topMatchScore < 0) topMatchScore = null;
    }
    return { ...toPublicRequest(r), author: toPublicUser(author), myMatchScore: topMatchScore };
  });

  res.json({ requests: enriched });
});

router.post('/', requireAuth, async (req, res) => {
  const { title, description, techStack, helpType, urgency } = req.body || {};

  if (!title || !description || !helpType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!HELP_TYPES.includes(helpType)) {
    return res.status(400).json({ error: 'Invalid help type' });
  }
  const finalUrgency = urgency && URGENCY_LEVELS.includes(urgency) ? urgency : 'medium';

  const r = await db.get(
    `INSERT INTO requests (user_id, title, description, tech_stack, help_type, urgency)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      req.userId,
      title,
      description,
      JSON.stringify(Array.isArray(techStack) ? techStack : []),
      helpType,
      finalUrgency,
    ]
  );

  res.status(201).json({ request: toPublicRequest(r) });
});

router.get('/:id', requireAuth, async (req, res) => {
  const requestId = Number(req.params.id);
  if (!Number.isInteger(requestId)) return res.status(400).json({ error: 'Invalid request id' });

  const r = await db.get('SELECT * FROM requests WHERE id = $1', [requestId]);
  if (!r) return res.status(404).json({ error: 'Request not found' });

  const author = await db.get('SELECT * FROM users WHERE id = $1', [r.user_id]);

  let matches = [];
  if (r.status === 'open') {
    const candidates = await db.all('SELECT * FROM users WHERE id <> $1', [r.user_id]);
    matches = candidates
      .map((c) => ({ user: toPublicUser(c), score: computeMatchScore(r, c, author.year) }))
      .filter((m) => m.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  const helper = r.accepted_helper_id
    ? await db.get('SELECT * FROM users WHERE id = $1', [r.accepted_helper_id])
    : null;

  res.json({
    request: toPublicRequest(r),
    author: toPublicUser(author),
    helper: helper ? toPublicUser(helper) : null,
    matches,
  });
});

router.post('/:id/invite', requireAuth, async (req, res) => {
  const requestId = Number(req.params.id);
  if (!Number.isInteger(requestId)) return res.status(400).json({ error: 'Invalid request id' });

  const r = await db.get('SELECT * FROM requests WHERE id = $1', [requestId]);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.user_id !== req.userId) {
    return res.status(403).json({ error: 'Only the requester can invite helpers' });
  }
  if (r.status !== 'open') return res.status(400).json({ error: 'Request is no longer open' });

  const helperId = Number(req.body?.helperId);
  if (!Number.isInteger(helperId)) return res.status(400).json({ error: 'Invalid helper id' });

  const helper = await db.get('SELECT id FROM users WHERE id = $1', [helperId]);
  if (!helper) return res.status(404).json({ error: 'Helper not found' });

  const requester = await db.get('SELECT name FROM users WHERE id = $1', [req.userId]);
  await notify(
    req.app,
    helper.id,
    'invite',
    `${requester.name} invited you to help with "${r.title}"`,
    r.id
  );
  res.json({ ok: true });
});

router.post('/:id/accept', requireAuth, async (req, res) => {
  const requestId = Number(req.params.id);
  if (!Number.isInteger(requestId)) return res.status(400).json({ error: 'Invalid request id' });

  const r = await db.get('SELECT * FROM requests WHERE id = $1', [requestId]);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.user_id === req.userId) {
    return res.status(400).json({ error: 'You cannot help your own request' });
  }

  // Guarding on status inside the UPDATE means two helpers racing to accept
  // can't both win — the loser gets zero rows back.
  const updated = await db.get(
    `UPDATE requests SET status = 'in_progress', accepted_helper_id = $1
     WHERE id = $2 AND status = 'open' RETURNING *`,
    [req.userId, requestId]
  );
  if (!updated) return res.status(400).json({ error: 'Request is no longer open' });

  const helper = await db.get('SELECT name FROM users WHERE id = $1', [req.userId]);
  await notify(
    req.app,
    r.user_id,
    'accepted',
    `${helper.name} is now helping with "${r.title}"`,
    r.id
  );

  const io = req.app.get('io');
  if (io) io.to(`request:${r.id}`).emit('request_updated', toPublicRequest(updated));

  res.json({ request: toPublicRequest(updated) });
});

router.post('/:id/resolve', requireAuth, async (req, res) => {
  const requestId = Number(req.params.id);
  if (!Number.isInteger(requestId)) return res.status(400).json({ error: 'Invalid request id' });

  const r = await db.get('SELECT * FROM requests WHERE id = $1', [requestId]);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (r.user_id !== req.userId) {
    return res.status(403).json({ error: 'Only the requester can mark this resolved' });
  }

  const updated = await db.get(
    `UPDATE requests SET status = 'resolved', resolved_at = NOW()
     WHERE id = $1 AND status = 'in_progress' RETURNING *`,
    [requestId]
  );
  if (!updated) return res.status(400).json({ error: 'Request must be in progress to resolve' });

  if (updated.accepted_helper_id) {
    const points = updated.urgency === 'high' ? 15 : updated.urgency === 'medium' ? 10 : 5;

    // Increment in SQL so concurrent resolves can't clobber each other's totals.
    const helper = await db.get(
      `UPDATE users SET reputation_points = reputation_points + $1, resolved_count = resolved_count + 1
       WHERE id = $2 RETURNING *`,
      [points, updated.accepted_helper_id]
    );
    await db.run('UPDATE users SET badges = $1 WHERE id = $2', [
      JSON.stringify(badgesForCount(helper.resolved_count)),
      helper.id,
    ]);

    await notify(
      req.app,
      helper.id,
      'resolved',
      `Your help on "${updated.title}" was marked resolved (+${points} pts)`,
      updated.id
    );
  }

  const io = req.app.get('io');
  if (io) io.to(`request:${updated.id}`).emit('request_updated', toPublicRequest(updated));

  res.json({ request: toPublicRequest(updated) });
});

router.get('/:id/messages', requireAuth, async (req, res) => {
  const requestId = Number(req.params.id);
  if (!Number.isInteger(requestId)) return res.status(400).json({ error: 'Invalid request id' });

  const rows = await db.all(
    `SELECT m.id, m.request_id, m.content, m.created_at, u.id AS sender_id, u.name AS sender_name
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.request_id = $1
     ORDER BY m.created_at ASC, m.id ASC`,
    [requestId]
  );

  const messages = rows.map((m) => ({
    id: m.id,
    requestId: m.request_id,
    content: m.content,
    createdAt: m.created_at,
    sender: { id: m.sender_id, name: m.sender_name },
  }));
  res.json({ messages });
});

router.post('/:id/messages', requireAuth, async (req, res) => {
  const requestId = Number(req.params.id);
  if (!Number.isInteger(requestId)) return res.status(400).json({ error: 'Invalid request id' });

  const { content } = req.body || {};
  if (!content || !content.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

  const r = await db.get('SELECT * FROM requests WHERE id = $1', [requestId]);
  if (!r) return res.status(404).json({ error: 'Request not found' });

  const participants = [r.user_id, r.accepted_helper_id].filter(Boolean);
  if (!participants.includes(req.userId)) {
    return res.status(403).json({ error: 'Only participants can send messages' });
  }

  const saved = await db.get(
    `INSERT INTO messages (request_id, sender_id, content) VALUES ($1, $2, $3)
     RETURNING id, created_at`,
    [requestId, req.userId, content.trim()]
  );
  const sender = await db.get('SELECT id, name FROM users WHERE id = $1', [req.userId]);

  const message = {
    id: saved.id,
    requestId,
    content: content.trim(),
    createdAt: saved.created_at,
    sender: { id: sender.id, name: sender.name },
  };

  const io = req.app.get('io');
  if (io) io.to(`request:${requestId}`).emit('new_message', message);

  const otherId = participants.find((id) => id !== req.userId);
  if (otherId) {
    await notify(
      req.app,
      otherId,
      'message',
      `${sender.name} sent a message on "${r.title}"`,
      requestId
    );
  }

  res.status(201).json({ message });
});

module.exports = router;
