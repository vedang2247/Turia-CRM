// Standalone, idempotent seed script for CRM tables.
// Run with: npm run seed
const config = require('../config');
const { createDatabase, initCrmSchema } = require('./database');

function seed(dbPath = config.dbPath) {
  console.log(`Seeding database at ${dbPath}...`);
  const db = createDatabase(dbPath, { includeCrm: true });
  initCrmSchema(db);

  // 1. Team Members (Single-user MVP: assignee & reviewer options)
  const teamMembers = [
    { name: 'Vedang Sharma', email: 'vedang@crm.internal', avatarUrl: null },
    { name: 'Priya Mehta', email: 'priya@crm.internal', avatarUrl: null },
    { name: 'Ravi Kumar', email: 'ravi@crm.internal', avatarUrl: null },
  ];

  const upsertTeamMember = db.prepare(`
    INSERT INTO team_members (name, email, avatar_url)
    VALUES (?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      name = excluded.name,
      avatar_url = excluded.avatar_url
  `);

  // 2. Clients
  const clients = [
    { name: 'Ananya Iyer', phone: '919876543210', email: 'ananya@client.com', company: null },
    { name: 'Suresh Gupta', phone: '919123456789', email: 'suresh@biz.in', company: null },
    { name: 'TechCorp Ltd', phone: null, email: 'contact@techcorp.io', company: 'TechCorp' },
    { name: 'Nisha Reddy', phone: '917890123456', email: 'nisha@example.com', company: null },
  ];

  const upsertClient = db.prepare(`
    INSERT INTO clients (name, phone, email, company, updated_at)
    VALUES (?, ?, ?, ?, (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')))
    ON CONFLICT(email) DO UPDATE SET
      name = excluded.name,
      phone = excluded.phone,
      company = excluded.company,
      updated_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  `);

  // 3. Email Templates
  const templates = [
    {
      name: 'Request Documents',
      subject: '[{{task.code}}] Documents Required — {{task.title}}',
      body: 'Dear {{client.name}},\n\nWe need the following documents for {{task.title}}...\n\nBest regards,\nSupport Team',
    },
    {
      name: 'Clarification Needed',
      subject: '[{{task.code}}] Clarification Required',
      body: 'Dear {{client.name}},\n\nWe need clarification regarding {{task.title}}...\n\nBest regards,\nSupport Team',
    },
    {
      name: 'Status Update',
      subject: '[{{task.code}}] Status Update — {{task.title}}',
      body: 'Dear {{client.name}},\n\nHere is an update on {{task.title}} (due {{task.dueDate}})...\n\nBest regards,\nSupport Team',
    },
    {
      name: 'Follow Up',
      subject: '[{{task.code}}] Following Up on {{task.title}}',
      body: 'Dear {{client.name}},\n\nJust following up on {{task.title}}...\n\nBest regards,\nSupport Team',
    },
  ];

  const checkTemplate = db.prepare('SELECT id FROM email_templates WHERE name = ?');
  const insertTemplate = db.prepare(`
    INSERT INTO email_templates (name, subject, body)
    VALUES (?, ?, ?)
  `);
  const updateTemplate = db.prepare(`
    UPDATE email_templates
    SET subject = ?, body = ?, updated_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    WHERE id = ?
  `);

  const runSeed = db.transaction(() => {
    // Seed team members
    for (const m of teamMembers) {
      upsertTeamMember.run(m.name, m.email, m.avatarUrl);
    }

    // Seed clients
    for (const c of clients) {
      upsertClient.run(c.name, c.phone, c.email, c.company);
    }

    // Seed email templates
    for (const t of templates) {
      const existing = checkTemplate.get(t.name);
      if (existing) {
        updateTemplate.run(t.subject, t.body, existing.id);
      } else {
        insertTemplate.run(t.name, t.subject, t.body);
      }
    }
  });

  runSeed();

  const counts = {
    teamMembers: db.prepare('SELECT COUNT(*) AS c FROM team_members').get().c,
    clients: db.prepare('SELECT COUNT(*) AS c FROM clients').get().c,
    templates: db.prepare('SELECT COUNT(*) AS c FROM email_templates').get().c,
  };

  console.log(`Seed complete! Database has:
  - ${counts.teamMembers} team members
  - ${counts.clients} clients
  - ${counts.templates} email templates`);

  db.close();
}

if (require.main === module) {
  try {
    seed();
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

module.exports = { seed };
