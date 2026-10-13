// Automated tests for CRM layer (Clients, Team, Templates, Chat Statuses, Tasks, Links, Emails).
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase, initCrmSchema } = require('../src/db/database');
const { createCrmControllers } = require('../src/controllers/crmController');
const { errorHandler } = require('../src/middleware/errorHandler');

let db, ctl;

beforeEach(() => {
  db = createDatabase(':memory:');
  initCrmSchema(db);
  ctl = createCrmControllers(db);
});

afterEach(() => {
  try { db.close(); } catch { /* ignore */ }
});

function call(handler, { params = {}, query = {}, body = {} } = {}) {
  let out;
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { out = { status: this.statusCode, body: payload }; return this; },
  };
  try {
    handler({ params, query, body }, res);
  } catch (err) {
    errorHandler(err, {}, res, () => {});
  }
  return out;
}

describe('CRM Clients API', () => {
  test('creates a valid client with normalized phone and email', () => {
    const res = call(ctl.clients.create, {
      body: {
        name: '  Ananya Iyer  ',
        phone: '+91 98765-43210@c.us',
        email: 'Ananya <Ananya@Client.com>',
        company: 'Iyer Enterprises',
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.name, 'Ananya Iyer');
    assert.equal(res.body.data.phone, '919876543210');
    assert.equal(res.body.data.email, 'ananya@client.com');
    assert.equal(res.body.data.company, 'Iyer Enterprises');
  });

  test('rejects duplicate client by email or phone with 409', () => {
    call(ctl.clients.create, {
      body: { name: 'Client 1', phone: '919876543210', email: 'client@domain.com' },
    });

    const dupEmail = call(ctl.clients.create, {
      body: { name: 'Client 2', email: 'client@domain.com' },
    });
    assert.equal(dupEmail.status, 409);
    assert.equal(dupEmail.body.error.code, 'CLIENT_EXISTS');

    const dupPhone = call(ctl.clients.create, {
      body: { name: 'Client 3', phone: '919876543210' },
    });
    assert.equal(dupPhone.status, 409);
    assert.equal(dupPhone.body.error.code, 'CLIENT_EXISTS');
  });

  test('matches a client by normalized phone number or email', () => {
    call(ctl.clients.create, {
      body: { name: 'Suresh Gupta', phone: '919123456789', email: 'suresh@biz.in' },
    });

    const matchPhone = call(ctl.clients.match, {
      query: { phone: '+91-9123456789@c.us' },
    });
    assert.equal(matchPhone.status, 200);
    assert.equal(matchPhone.body.data.name, 'Suresh Gupta');

    const matchEmail = call(ctl.clients.match, {
      query: { email: 'SURESH@biz.in' },
    });
    assert.equal(matchEmail.status, 200);
    assert.equal(matchEmail.body.data.name, 'Suresh Gupta');

    const noMatch = call(ctl.clients.match, {
      query: { phone: '910000000000' },
    });
    assert.equal(noMatch.status, 200);
    assert.equal(noMatch.body.data, null);
  });

  test('lists clients and filters by search query', () => {
    call(ctl.clients.create, { body: { name: 'Alpha Tech', company: 'Alpha Inc' } });
    call(ctl.clients.create, { body: { name: 'Beta Systems', company: 'Beta LLC' } });

    const all = call(ctl.clients.list);
    assert.equal(all.status, 200);
    assert.equal(all.body.data.length, 2);

    const filtered = call(ctl.clients.list, { query: { q: 'Alpha' } });
    assert.equal(filtered.status, 200);
    assert.equal(filtered.body.data.length, 1);
    assert.equal(filtered.body.data[0].name, 'Alpha Tech');
  });
});

describe('CRM Team Members API', () => {
  test('lists team members', () => {
    db.prepare("INSERT INTO team_members (name, email) VALUES ('Vedang', 'vedang@crm.internal')").run();
    const res = call(ctl.team.list);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].name, 'Vedang');
  });
});

describe('CRM Email Templates API', () => {
  test('creates, gets, updates, and deletes an email template', () => {
    // Create
    const createRes = call(ctl.templates.create, {
      body: {
        name: 'Document Request',
        subject: '[{{task.code}}] Docs for {{task.title}}',
        body: 'Please send documents, {{client.name}}.',
      },
    });
    assert.equal(createRes.status, 201);
    const id = createRes.body.data.id;
    assert.ok(id);

    // Get
    const getRes = call(ctl.templates.get, { params: { id: String(id) } });
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.name, 'Document Request');

    // Update
    const updateRes = call(ctl.templates.update, {
      params: { id: String(id) },
      body: { name: 'Updated Request' },
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.name, 'Updated Request');

    // Delete
    const delRes = call(ctl.templates.delete, { params: { id: String(id) } });
    assert.equal(delRes.status, 200);
    assert.equal(delRes.body.data.deleted, true);

    // Verify 404
    const notFoundRes = call(ctl.templates.get, { params: { id: String(id) } });
    assert.equal(notFoundRes.status, 404);
  });

  test('rejects template without required fields', () => {
    const res = call(ctl.templates.create, { body: { name: '' } });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });
});

describe('CRM Chat Statuses API', () => {
  test('upserts and retrieves chat statuses by chatIds', () => {
    const set1 = call(ctl.chats.setStatus, {
      body: { chatId: '919812345678@c.us', status: 'resolved' },
    });
    assert.equal(set1.status, 200);
    assert.equal(set1.body.data.status, 'resolved');

    const getRes = call(ctl.chats.getStatus, {
      query: { chatIds: '919812345678@c.us,other@c.us' },
    });
    assert.equal(getRes.status, 200);
    assert.deepEqual(getRes.body.data.statuses, {
      '919812345678@c.us': 'resolved',
    });

    // Update to open
    call(ctl.chats.setStatus, {
      body: { chatId: '919812345678@c.us', status: 'open' },
    });
    const getRes2 = call(ctl.chats.getStatus, {
      query: { chatIds: '919812345678@c.us' },
    });
    assert.equal(getRes2.body.data.statuses['919812345678@c.us'], 'open');
  });

  test('rejects invalid chat status', () => {
    const res = call(ctl.chats.setStatus, {
      body: { chatId: '123@c.us', status: 'unknown_status' },
    });
    assert.equal(res.status, 400);
  });
});

describe('CRM Tasks API', () => {
  test('creates task with generated TSK code and defaults', () => {
    const res = call(ctl.tasks.create, {
      body: { title: 'File MCA Compliance' },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.title, 'File MCA Compliance');
    assert.equal(res.body.data.code, 'TSK0001');
    assert.equal(res.body.data.status, 'open');
    assert.equal(res.body.data.priority, 'medium');
  });

  test('assigns client, assignee, and retrieves relationships', () => {
    const client = call(ctl.clients.create, { body: { name: 'Acme Corp' } }).body.data;
    db.prepare("INSERT INTO team_members (name, email) VALUES ('Priya', 'priya@crm.internal')").run();
    const teamMember = db.prepare('SELECT id FROM team_members WHERE name = ?').get('Priya');

    const taskRes = call(ctl.tasks.create, {
      body: {
        title: 'GST Audit Task',
        clientId: client.id,
        assigneeId: teamMember.id,
        status: 'in_progress',
        priority: 'high',
      },
    });

    assert.equal(taskRes.status, 201);
    assert.equal(taskRes.body.data.client.name, 'Acme Corp');
    assert.equal(taskRes.body.data.assignee.name, 'Priya');
    assert.equal(taskRes.body.data.status, 'in_progress');
    assert.equal(taskRes.body.data.priority, 'high');
  });

  test('updates task details and status', () => {
    const created = call(ctl.tasks.create, { body: { title: 'Initial Title' } }).body.data;
    const updated = call(ctl.tasks.update, {
      params: { id: String(created.id) },
      body: { title: 'Updated Title', status: 'resolved' },
    });

    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.title, 'Updated Title');
    assert.equal(updated.body.data.status, 'resolved');
  });

  test('lists tasks with status/search filtering and pagination', () => {
    call(ctl.tasks.create, { body: { title: 'Audit Task 1', status: 'open' } });
    call(ctl.tasks.create, { body: { title: 'Audit Task 2', status: 'in_progress' } });
    call(ctl.tasks.create, { body: { title: 'Filing Task', status: 'open' } });

    const openTasks = call(ctl.tasks.list, { query: { status: 'open' } });
    assert.equal(openTasks.body.data.total, 2);
    assert.equal(openTasks.body.data.items.length, 2);

    const searchRes = call(ctl.tasks.list, { query: { search: 'Audit' } });
    assert.equal(searchRes.body.data.total, 2);

    const paged = call(ctl.tasks.list, { query: { page: '1', limit: '1' } });
    assert.equal(paged.body.data.total, 3);
    assert.equal(paged.body.data.items.length, 1);
  });

  test('deletes task and cascades related links and emails', () => {
    const task = call(ctl.tasks.create, { body: { title: 'Task to Delete' } }).body.data;

    // Add link
    call(ctl.tasks.addLink, {
      params: { id: String(task.id) },
      body: { type: 'whatsapp', chatId: '123@c.us', messageId: 'msg1', snapshot: 'Hello' },
    });

    // Record email
    call(ctl.tasks.recordEmail, {
      params: { id: String(task.id) },
      body: { toAddress: 'client@domain.com', subject: 'Subject', bodyText: 'Body' },
    });

    assert.equal(db.prepare('SELECT COUNT(*) AS c FROM task_links WHERE task_id = ?').get(task.id).c, 1);
    assert.equal(db.prepare('SELECT COUNT(*) AS c FROM task_emails WHERE task_id = ?').get(task.id).c, 1);

    // Delete task
    const delRes = call(ctl.tasks.delete, { params: { id: String(task.id) } });
    assert.equal(delRes.status, 200);

    // Verify cascade
    assert.equal(db.prepare('SELECT COUNT(*) AS c FROM task_links WHERE task_id = ?').get(task.id).c, 0);
    assert.equal(db.prepare('SELECT COUNT(*) AS c FROM task_emails WHERE task_id = ?').get(task.id).c, 0);
  });
});

describe('CRM Task Communication Links API', () => {
  test('adds WhatsApp link and email link, queries by chat and thread badges', () => {
    const task = call(ctl.tasks.create, { body: { title: 'Badge Test Task' } }).body.data;

    // WhatsApp link
    const waLink = call(ctl.tasks.addLink, {
      params: { id: String(task.id) },
      body: {
        type: 'whatsapp',
        chatId: '919812345678@c.us',
        messageId: 'false_919812345678@c.us_ABC123',
        snapshot: 'Can you file my tax return?',
        note: 'Important client query',
      },
    });
    assert.equal(waLink.status, 201);
    assert.equal(waLink.body.data.snapshot, 'Can you file my tax return?');

    // Email link
    const emailLink = call(ctl.tasks.addLink, {
      params: { id: String(task.id) },
      body: {
        type: 'email',
        threadId: 'thread_xyz789',
        subject: 'Tax Documents Attached',
        sender: 'client@example.com',
        note: 'Docs received via email',
      },
    });
    assert.equal(emailLink.status, 201);
    assert.equal(emailLink.body.data.threadId, 'thread_xyz789');

    // Query badge by chat
    const chatBadges = call(ctl.tasks.getLinksByChat, {
      query: { chatId: '919812345678@c.us' },
    });
    assert.equal(chatBadges.status, 200);
    assert.ok(chatBadges.body.data['false_919812345678@c.us_ABC123']);
    assert.equal(chatBadges.body.data['false_919812345678@c.us_ABC123'].taskCode, task.code);

    // Query badge by thread
    const threadBadges = call(ctl.tasks.getLinksByThread, {
      query: { threadId: 'thread_xyz789' },
    });
    assert.equal(threadBadges.status, 200);
    assert.equal(threadBadges.body.data.length, 1);
    assert.equal(threadBadges.body.data[0].taskCode, task.code);

    // Remove link
    const removeRes = call(ctl.tasks.removeLink, {
      params: { id: String(task.id), linkId: String(waLink.body.data.id) },
    });
    assert.equal(removeRes.status, 200);
    assert.equal(removeRes.body.data.deleted, true);
  });
});

describe('CRM Task Emails & Send Logging', () => {
  test('recording an email logs it and automatically creates a task link', () => {
    const task = call(ctl.tasks.create, { body: { title: 'Email Test Task' } }).body.data;

    const res = call(ctl.tasks.recordEmail, {
      params: { id: String(task.id) },
      body: {
        toAddress: 'ananya@client.com',
        subject: `[${task.code}] Status Update — ${task.title}`,
        bodyText: 'Your task has been started.',
        gmailMsgId: 'msg_gm_123',
        threadId: 'thread_gm_456',
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.taskEmail.toAddress, 'ananya@client.com');
    assert.equal(res.body.data.taskEmail.gmailMsgId, 'msg_gm_123');

    // Auto-created link
    assert.ok(res.body.data.taskLink);
    assert.equal(res.body.data.taskLink.type, 'email');
    assert.equal(res.body.data.taskLink.threadId, 'thread_gm_456');

    // Check task detail contains both in timeline
    const detail = call(ctl.tasks.get, { params: { id: String(task.id) } });
    assert.equal(detail.body.data.sentEmails.length, 1);
    assert.equal(detail.body.data.links.length, 1);
  });
});
