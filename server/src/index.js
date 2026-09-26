require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const db = require('./db');
const { JWT_SECRET } = require('./middleware/auth');
const { router: authRouter } = require('./routes/auth');
const usersRouter = require('./routes/users');
const requestsRouter = require('./routes/requests');
const notificationsRouter = require('./routes/notifications');
const chatsRouter = require('./routes/chats');

const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';
const CLIENT_DIST = path.join(__dirname, '..', '..', 'client', 'dist');

const app = express();
const server = http.createServer(app);

// In production the API and the built client share an origin, so CORS is unnecessary.
// In development Vite runs on its own port and proxies through to here.
const corsOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const io = new Server(server, isProduction ? {} : { cors: { origin: corsOrigin } });
app.set('io', io);

app.set('trust proxy', 1); // hosts sit behind a proxy; needed for correct rate-limit IPs
if (!isProduction) app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/chats', chatsRouter);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Serve the built client and let React Router handle non-API routes.
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get(/.*/, (req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
} else if (isProduction) {
  console.warn(`No client build found at ${CLIENT_DIST}. Run "npm run build" before starting.`);
}

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Something went wrong' });
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    socket.userId = jwt.verify(token, JWT_SECRET).userId;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.userId}`);
  socket.on('join_request', (requestId) => socket.join(`request:${Number(requestId)}`));
  socket.on('leave_request', (requestId) => socket.leave(`request:${Number(requestId)}`));
});

async function start() {
  await db.init();
  console.log('Database schema ready.');
  server.listen(PORT, () => {
    console.log(`CampusConnect API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
