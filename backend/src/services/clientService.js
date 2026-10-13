// Business logic and SQL execution for Clients.
const { validateClient, normalisePhone, extractEmail } = require('../validators/crmValidator');
const { HttpError } = require('../middleware/errorHandler');

function rowToClient(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    company: row.company,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createClientService(db) {
  const getByIdStmt = db.prepare('SELECT * FROM clients WHERE id = ?');
  const getByPhoneStmt = db.prepare('SELECT * FROM clients WHERE phone = ?');
  const getByEmailStmt = db.prepare('SELECT * FROM clients WHERE lower(email) = lower(?)');

  const listStmt = db.prepare(`
    SELECT * FROM clients
    WHERE (? = '' OR lower(name) LIKE lower(?) ESCAPE '\\' OR lower(company) LIKE lower(?) ESCAPE '\\')
    ORDER BY name ASC
  `);

  const insertStmt = db.prepare(`
    INSERT INTO clients (name, phone, email, company, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  return {
    list({ search = '' } = {}) {
      const q = typeof search === 'string' ? search.trim() : '';
      const like = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
      return listStmt.all(q, like, like).map(rowToClient);
    },

    get(id) {
      return rowToClient(getByIdStmt.get(id));
    },

    match({ phone, email }) {
      if (phone) {
        const norm = normalisePhone(phone);
        if (norm) {
          const found = getByPhoneStmt.get(norm);
          if (found) return rowToClient(found);
        }
      }
      if (email) {
        const norm = extractEmail(email);
        if (norm) {
          const found = getByEmailStmt.get(norm);
          if (found) return rowToClient(found);
        }
      }
      return null;
    },

    create(input) {
      const v = validateClient(input);
      if (!v.valid) {
        throw new HttpError(400, 'VALIDATION_ERROR', v.errors.join(' '), v.errors);
      }
      const { name, phone, email, company } = v.value;

      if (phone) {
        const existingPhone = getByPhoneStmt.get(phone);
        if (existingPhone) {
          throw new HttpError(409, 'CLIENT_EXISTS', 'A client with this phone number already exists.');
        }
      }
      if (email) {
        const existingEmail = getByEmailStmt.get(email);
        if (existingEmail) {
          throw new HttpError(409, 'CLIENT_EXISTS', 'A client with this email address already exists.');
        }
      }

      const now = new Date().toISOString();
      try {
        const info = insertStmt.run(name, phone, email, company, now, now);
        return rowToClient(getByIdStmt.get(info.lastInsertRowid));
      } catch (err) {
        if (err.message?.includes('UNIQUE constraint failed')) {
          throw new HttpError(409, 'CLIENT_EXISTS', 'A client with this phone or email already exists.');
        }
        throw err;
      }
    },
  };
}

module.exports = { createClientService, rowToClient };
