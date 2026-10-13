-- Runs on every server start. "IF NOT EXISTS" makes it safe to re-run.
-- Timestamps are ISO-8601 UTC strings, e.g. 2026-10-10T12:30:45.123Z

CREATE TABLE IF NOT EXISTS agents (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL CHECK (length(trim(name)) > 0),
  module       TEXT    NOT NULL CHECK (module IN ('Task', 'DSC', 'License')),
  description  TEXT,
  status       TEXT    NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft', 'published', 'disabled')),
  config_json  TEXT    NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id          INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  run_type          TEXT    NOT NULL DEFAULT 'test' CHECK (run_type IN ('test', 'actual')),
  status            TEXT    NOT NULL CHECK (status IN ('success', 'failed')),
  trigger_data_json TEXT,
  result_json       TEXT,
  error_message     TEXT,
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Indexes match the queries we will run: filter agents by module/status,
-- and fetch runs for one agent (or all runs) newest-first.
CREATE INDEX IF NOT EXISTS idx_agents_module_status ON agents (module, status);
CREATE INDEX IF NOT EXISTS idx_agents_updated_at    ON agents (updated_at);
CREATE INDEX IF NOT EXISTS idx_runs_agent_created   ON agent_runs (agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_runs_created         ON agent_runs (created_at);

-- ============================================================================
-- CRM TABLES & INDEXES
-- ============================================================================

-- Team members for assignee and reviewer assignment (Single-user MVP)
CREATE TABLE IF NOT EXISTS team_members (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL CHECK (length(trim(name)) > 0),
  email      TEXT    NOT NULL UNIQUE CHECK (length(trim(email)) > 0),
  avatar_url TEXT,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Clients table for auto-matching incoming WhatsApp/Email contacts
CREATE TABLE IF NOT EXISTS clients (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL CHECK (length(trim(name)) > 0),
  phone      TEXT    UNIQUE, -- Normalized E.164 digits without '+' (e.g. 919812345678)
  email      TEXT    UNIQUE, -- Normalized lowercase email
  company    TEXT,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- CRM Tasks
-- Code format TSK0001 is derived in application logic: 'TSK' + String(id).padStart(4, '0')
CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,
  status      TEXT    NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  priority    TEXT    NOT NULL DEFAULT 'medium'
                      CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date    TEXT,   -- ISO-8601 string (e.g. 2026-10-25)
  client_id   INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  assignee_id INTEGER REFERENCES team_members(id) ON DELETE SET NULL,
  reviewer_id INTEGER REFERENCES team_members(id) ON DELETE SET NULL,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Task Communication Links (WhatsApp message snapshots & Email thread references)
CREATE TABLE IF NOT EXISTS task_links (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type       TEXT    NOT NULL CHECK (type IN ('whatsapp', 'email')),
  -- WhatsApp metadata (snapshot mandatory for WhatsApp)
  chat_id    TEXT,   -- e.g. 919812345678@c.us
  message_id TEXT,   -- unique WA message id
  snapshot   TEXT,   -- message body snapshot at time of linking
  -- Email metadata (Gmail is source of truth; store headers only)
  thread_id  TEXT,   -- Gmail threadId
  subject    TEXT,   -- thread subject
  sender     TEXT,   -- sender email
  note       TEXT,   -- optional reference note
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Reusable Email Templates with placeholders:
-- {{client.name}}, {{task.code}}, {{task.title}}, {{task.dueDate}}
CREATE TABLE IF NOT EXISTS email_templates (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL CHECK (length(trim(name)) > 0),
  subject    TEXT    NOT NULL,
  body       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Record of emails sent from within a task
CREATE TABLE IF NOT EXISTS task_emails (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id      INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  to_address   TEXT    NOT NULL CHECK (length(trim(to_address)) > 0),
  subject      TEXT    NOT NULL,
  body_text    TEXT    NOT NULL,
  gmail_msg_id TEXT,   -- message ID returned by Gmail API
  thread_id    TEXT,   -- thread ID returned by Gmail API
  sent_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Chat status tracking (persisted to SQLite instead of localStorage)
CREATE TABLE IF NOT EXISTS chat_statuses (
  chat_id    TEXT PRIMARY KEY, -- e.g. 919812345678@c.us
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status        ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_client        ON tasks (client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee      ON tasks (assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at    ON tasks (updated_at);
CREATE INDEX IF NOT EXISTS idx_task_links_task     ON task_links (task_id);
CREATE INDEX IF NOT EXISTS idx_task_links_wa       ON task_links (chat_id, message_id);
CREATE INDEX IF NOT EXISTS idx_task_links_email    ON task_links (thread_id);
CREATE INDEX IF NOT EXISTS idx_task_emails_task    ON task_emails (task_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone       ON clients (phone);
CREATE INDEX IF NOT EXISTS idx_clients_email       ON clients (email);

