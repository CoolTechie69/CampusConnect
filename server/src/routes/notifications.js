const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const rows = await db.all(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 30',
    [req.userId]
  );
  res.json({
    notifications: rows.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      requestId: n.request_id,
      read: n.read,
      createdAt: n.created_at,
    })),
  });
});

router.post('/read-all', requireAuth, async (req, res) => {
  await db.run('UPDATE notifications SET read = TRUE WHERE user_id = $1', [req.userId]);
  res.json({ ok: true });
});

module.exports = router;
