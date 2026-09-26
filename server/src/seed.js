// Seeds demo users and requests. Run with: npm run seed
require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const db = require('./db');
const { badgesForCount } = require('./utils/badges');

const USERS = [
  { name: 'Ananya Rao', email: 'ananya@hitam.org', department: 'Computer Science', year: 4, skills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'Express'], bio: 'Final year CS. Full-stack dev, happy to debug React/Node issues.', resolved: 12 },
  { name: 'Rohit Menon', email: 'rohit@hitam.org', department: 'AI & Data Science', year: 3, skills: ['Python', 'Machine Learning', 'Deep Learning', 'Data Science'], bio: 'ML enthusiast. Ask me about model training and data pipelines.', resolved: 7 },
  { name: 'Sneha Iyer', email: 'sneha@hitam.org', department: 'Information Technology', year: 4, skills: ['Java', 'DSA', 'SQL', 'Docker'], bio: 'Placement prep + backend. DSA doubts welcome.', resolved: 5 },
  { name: 'Karan Gupta', email: 'karan@hitam.org', department: 'Electronics', year: 2, skills: ['C', 'C++', 'Arduino'], bio: 'Embedded systems and microcontrollers.', resolved: 1 },
  { name: 'Priya Nair', email: 'priya@hitam.org', department: 'Computer Science', year: 2, skills: ['HTML/CSS', 'JavaScript', 'React', 'Figma'], bio: 'Frontend and UI design. Second year.', resolved: 0 },
  { name: 'Dev Sharma', email: 'dev@hitam.org', department: 'Computer Science', year: 1, skills: ['Python', 'C'], bio: 'First year, learning the ropes.', resolved: 0 },
];

const REQUESTS = [
  { authorEmail: 'dev@hitam.org', title: 'Python list comprehension returning wrong output', description: "I'm trying to filter even numbers and square them in one line but my output has odd numbers too. I've tried a few variations and can't spot the mistake. Can someone explain what's actually happening?", techStack: ['Python'], helpType: 'concept', urgency: 'medium' },
  { authorEmail: 'priya@hitam.org', title: 'React useEffect firing infinitely on state update', description: "My component re-renders forever when I set state inside useEffect. I added a dependency array but it still loops. Deadline for my mini project is in two days.", techStack: ['React', 'JavaScript'], helpType: 'debugging', urgency: 'high' },
  { authorEmail: 'karan@hitam.org', title: 'Need a code review for my Arduino sensor project', description: "Built a temperature logger with an ESP32. The code works but I think my interrupt handling is sketchy. Would appreciate someone experienced taking a look before I submit.", techStack: ['C++', 'Arduino'], helpType: 'code_review', urgency: 'low' },
  { authorEmail: 'priya@hitam.org', title: 'Database schema design review for a college event app', description: "I have users, events, registrations and feedback tables. Not sure if I should normalize the feedback table further or keep it simple. Looking for a design review.", techStack: ['SQL', 'MongoDB'], helpType: 'design_review', urgency: 'medium' },
  { authorEmail: 'dev@hitam.org', title: 'Getting segmentation fault in linked list insert', description: "Writing a singly linked list in C. Insert at head works but insert at position crashes. I think I'm dereferencing a null pointer somewhere but can't find it.", techStack: ['C', 'DSA'], helpType: 'debugging', urgency: 'high' },
];

async function seed() {
  await db.init();

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    throw new Error(
      'Refusing to wipe a production database. Set ALLOW_SEED=true only if you really mean it.'
    );
  }

  const existing = await db.get('SELECT COUNT(*)::int AS c FROM users');
  if (existing.c > 0) {
    console.log(`Database already has ${existing.c} users. Clearing and re-seeding…`);
    await db.run('TRUNCATE messages, notifications, requests, users RESTART IDENTITY CASCADE');
  }

  const passwordHash = bcrypt.hashSync('password123', 10);
  const idByEmail = {};

  for (const u of USERS) {
    const row = await db.get(
      `INSERT INTO users (name, email, password_hash, department, year, skills, bio, reputation_points, resolved_count, badges)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        u.name,
        u.email,
        passwordHash,
        u.department,
        u.year,
        JSON.stringify(u.skills),
        u.bio,
        u.resolved * 10,
        u.resolved,
        JSON.stringify(badgesForCount(u.resolved)),
      ]
    );
    idByEmail[u.email] = row.id;
  }

  for (const r of REQUESTS) {
    await db.run(
      `INSERT INTO requests (user_id, title, description, tech_stack, help_type, urgency)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        idByEmail[r.authorEmail],
        r.title,
        r.description,
        JSON.stringify(r.techStack),
        r.helpType,
        r.urgency,
      ]
    );
  }

  console.log(`Seeded ${USERS.length} users and ${REQUESTS.length} requests.`);
  console.log('Login with any seeded email, password: password123');
  console.log('e.g. ananya@hitam.org / password123');
}

seed()
  .then(() => db.pool.end())
  .catch(async (err) => {
    console.error('Seed failed:', err.message);
    await db.pool.end();
    process.exit(1);
  });
