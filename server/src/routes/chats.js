const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { toPublicUser } = require('./auth');

const router = express.Router();

// Every request the user is connected on, newest activity first.
router.get('/', requireAuth, async (req, res) => {
  const rows = await db.all(
    `SELECT
       r.*,
       u.id   AS other_id,
       COALESCE(counts.message_count, 0) AS message_count,
       last.content    AS last_content,
       last.created_at AS last_created_at,
       last.sender_id  AS last_sender_id,
       last.id         AS last_message_id
     FROM requests r
     JOIN users u
       ON u.id = CASE WHEN r.user_id = $1 THEN r.accepted_helper_id ELSE r.user_id END
     LEFT JOIN (
       SELECT request_id, COUNT(*)::int AS message_count
       FROM messages
       GROUP BY request_id
     ) counts ON counts.request_id = r.id
     LEFT JOIN (
       SELECT DISTINCT ON (request_id) request_id, id, content, created_at, sender_id
       FROM messages
       ORDER BY request_id, created_at DESC, id DESC
     ) last ON last.request_id = r.id
     WHERE (r.user_id = $1 OR r.accepted_helper_id = $1)
       AND r.accepted_helper_id IS NOT NULL
     ORDER BY COALESCE(last.created_at, r.created_at) DESC, last.id DESC NULLS LAST, r.id DESC`,
    [req.userId]
  );

  const otherIds = [...new Set(rows.map((r) => r.other_id))];
  const others = otherIds.length
    ? await db.all('SELECT * FROM users WHERE id = ANY($1::int[])', [otherIds])
    : [];
  const otherById = new Map(others.map((u) => [u.id, u]));

  const chats = rows.map((r) => ({
    requestId: r.id,
    title: r.title,
    status: r.status,
    urgency: r.urgency,
    techStack: JSON.parse(r.tech_stack),
    isRequester: r.user_id === req.userId,
    other: toPublicUser(otherById.get(r.other_id)),
    messageCount: Number(r.message_count),
    lastMessage: r.last_message_id
      ? { content: r.last_content, createdAt: r.last_created_at, senderId: r.last_sender_id }
      : null,
    lastActivity: r.last_created_at || r.created_at,
    lastMessageId: r.last_message_id || 0,
  }));

  res.json({ chats });
});

module.exports = router;
