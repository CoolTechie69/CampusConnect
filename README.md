# CampusConnect

A college-only peer help platform that matches students to the right helper based on academic
relevance and urgency — not popularity.

## Quick start

CampusConnect stores data in **Postgres**, so you need a connection string before the server will
start. [Neon](https://neon.tech) has a free tier that works well; create a project, then use a
separate Neon *branch* for local development so you never write test data into live student data.

```bash
npm run install:all                      # install root, server and client dependencies
cp server/.env.example server/.env       # then paste your DATABASE_URL into server/.env
npm run seed                             # create tables + load demo users and requests
npm run dev                              # start API (:4000) and web app (:5173)
```

Open http://localhost:5173

### Demo accounts

All seeded accounts use the password `password123`:

| Email | Year | Skills |
| --- | --- | --- |
| `ananya@hitam.org` | 4 | React, Node.js, MongoDB, JavaScript, Express |
| `rohit@hitam.org` | 3 | Python, Machine Learning, Deep Learning |
| `sneha@hitam.org` | 4 | Java, DSA, SQL, Docker |
| `karan@hitam.org` | 2 | C, C++, Arduino |
| `priya@hitam.org` | 2 | HTML/CSS, JavaScript, React, Figma |
| `dev@hitam.org` | 1 | Python, C |

To see matching in action, log in as `priya@hitam.org` and open the React `useEffect` request —
Ananya scores ~95% while non-matching seniors score below 40%.

To see the live chat, open two browsers: post/answer as the requester in one and the helper in the other.

## Stack

- **Frontend** — React 19 + Vite, React Router, Tailwind CSS v4, Socket.IO client
- **Backend** — Express 5, JWT auth, bcrypt, Socket.IO
- **Database** — SQLite via Node's built-in `node:sqlite` (no native build step)

## Features

- **College-verified signup** — signups are restricted to `@hitam.org` addresses via
  `ALLOWED_EMAIL_DOMAINS` in `server/.env`. Subdomains such as `cse.hitam.org` are accepted too.
  Add more domains as a comma-separated list, or leave the value empty to accept any email.
- **Structured help requests** — title, description, tech stack, help type (debugging / concept /
  design review / code review) and urgency. High-urgency requests are pinned to the top of the feed.
- **Smart matching** — each request is scored per candidate helper (`server/src/utils/match.js`):
  skill overlap (55%), seniority (up to 15), availability (up to 15), urgency-weighted experience
  and past help activity. Returns the top 3 helpers for *that request* — it is not a global ranking.
- **Connect** — a helper claims a request with **Connect**, which opens the conversation in the chat
  section. Requesters can also invite a suggested helper, which sends them a notification.
- **Chats** — a dedicated section listing every conversation you're connected on, with the other
  student, the request it belongs to, and a live message preview. Threads are real-time over
  Socket.IO and restricted to the requester and their helper. The requester can mark the request
  resolved from inside the thread.
- **Reputation & badges** — +15/+10/+5 points per resolved request by urgency; badges at 1, 5, 10 and
  25 students helped. Leaderboard is recognition only and never affects matching.
- **Availability toggle** — marking yourself busy removes you from match suggestions.

## Project structure

```
server/src
  index.js          Express app, Socket.IO setup and auth handshake
  db/index.js       SQLite schema and connection
  routes/           auth, users, requests (+ messages, invite, accept, resolve), notifications
  utils/match.js    match scoring algorithm
  utils/badges.js   badge thresholds
  seed.js           demo data

client/src
  pages/            Login, Signup, Dashboard, NewRequest, RequestDetail, Chats, Profile, EditProfile, Leaderboard
  components/       Navbar, RequestCard, MatchCard, TagInput, Avatar, Badge, Pills
  context/          AuthContext (JWT), SocketContext (realtime)
```

## Deployment

In production the API also serves the built frontend, so this deploys as **one web service** —
no separate frontend host, and no CORS configuration.

### 1. Create the database

Create a Postgres database (Neon, Supabase or Render all have free tiers) and copy its connection
string. Tables are created automatically on first boot.

### 2. Deploy the app

Push this repo to GitHub, then create a web service on your host of choice:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Start command | `npm start` |
| Node version | 20 or newer |

### 3. Set environment variables

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Your Postgres connection string |
| `JWT_SECRET` | A long random string — see below |
| `NODE_ENV` | `production` |
| `ALLOWED_EMAIL_DOMAINS` | `hitam.org` |

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The server **refuses to start** in production if `JWT_SECRET` is missing or still the dev default.
That is deliberate: with a known secret, anyone could forge a login token for any student.

### 4. Seeding

Don't seed a live database — `npm run seed` **wipes every table**. It refuses to run when
`NODE_ENV=production` unless you also set `ALLOW_SEED=true`. Real users sign up through the app.

## Notes

- Tables are created on boot by `db.init()`; there is no separate migration step yet. If you later
  change the schema, add a migration rather than editing `SCHEMA` in place, or existing deployments
  won't pick the change up.
- Login is rate limited to 10 attempts per 15 minutes per IP, signup to 5 per hour.
- Accepting and resolving a request are guarded inside the `UPDATE` statement, so two students
  racing to help the same request can't both win.
