// Opens the SQLite file and makes sure the tables exist.
// createDatabase(path) is a factory so tests can pass ':memory:' or a temp
// file and never touch the real demo database.
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

function createDatabase(dbPath, { includeCrm = false } = {}) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new Database(dbPath);

  // SQLite does NOT enforce foreign keys unless asked, per connection.
  db.pragma('foreign_keys = ON');
  // WAL = better concurrency and crash-safety for a file database.
  if (dbPath !== ':memory:') db.pragma('journal_mode = WAL');

  const fullSchema = fs.readFileSync(SCHEMA_PATH, 'utf8');

  if (includeCrm) {
    db.exec(fullSchema);
  } else {
    // Legacy Agent Center schema (before CRM section)
    const marker = '-- CRM TABLES & INDEXES';
    const coreSchema = fullSchema.includes(marker)
      ? fullSchema.split(marker)[0]
      : fullSchema;
    db.exec(coreSchema);
  }

  return db;
}

function initCrmSchema(db) {
  const fullSchema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const marker = '-- CRM TABLES & INDEXES';
  if (fullSchema.includes(marker)) {
    const crmSql = fullSchema.substring(fullSchema.indexOf(marker));
    db.exec(crmSql);
  } else {
    db.exec(fullSchema);
  }
}

module.exports = { createDatabase, initCrmSchema, SCHEMA_PATH };
