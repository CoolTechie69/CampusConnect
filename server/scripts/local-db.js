// Starts a real Postgres server on localhost for development, so the project
// runs without signing up for a hosted database. Data lives in server/.pgdata.
// Production uses DATABASE_URL and never touches this.
const path = require('node:path');
const fs = require('node:fs');

const DATA_DIR = path.join(__dirname, '..', '.pgdata');
const PORT = Number(process.env.LOCAL_DB_PORT || 55432);
const USER = 'campus';
const PASSWORD = 'campus';
const DATABASE = 'campusconnect';

const CONNECTION_STRING = `postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DATABASE}`;

async function main() {
  const EmbeddedPostgres = require('embedded-postgres').default;

  const isFirstRun = !fs.existsSync(DATA_DIR);
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
  });

  if (isFirstRun) {
    console.log('Initialising a local Postgres cluster (first run only)…');
    await pg.initialise();
  }

  await pg.start();

  // Always attempt this: an interrupted first run can leave a cluster with no database.
  try {
    await pg.createDatabase(DATABASE);
    console.log(`Created database "${DATABASE}".`);
  } catch (err) {
    if (!/already exists/i.test(err.message)) throw err;
  }

  console.log(`\nLocal Postgres ready on port ${PORT}.`);
  console.log(`DATABASE_URL=${CONNECTION_STRING}\n`);
  console.log('Leave this running. Press Ctrl+C to stop.');

  const shutdown = async () => {
    console.log('\nStopping local Postgres…');
    try {
      await pg.stop();
    } catch {
      // already stopped
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Could not start local Postgres:', err.message);
  process.exit(1);
});

module.exports = { CONNECTION_STRING };
