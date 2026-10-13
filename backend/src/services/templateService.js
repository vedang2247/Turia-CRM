// Business logic and SQL execution for Email Templates.
const { validateTemplate } = require('../validators/crmValidator');
const { HttpError } = require('../middleware/errorHandler');

function rowToTemplate(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createTemplateService(db) {
  const listStmt = db.prepare('SELECT * FROM email_templates ORDER BY name ASC');
  const getByIdStmt = db.prepare('SELECT * FROM email_templates WHERE id = ?');
  const insertStmt = db.prepare(`
    INSERT INTO email_templates (name, subject, body, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const updateStmt = db.prepare(`
    UPDATE email_templates
    SET name = ?, subject = ?, body = ?, updated_at = ?
    WHERE id = ?
  `);
  const deleteStmt = db.prepare('DELETE FROM email_templates WHERE id = ?');

  return {
    list() {
      return listStmt.all().map(rowToTemplate);
    },

    get(id) {
      return rowToTemplate(getByIdStmt.get(id));
    },

    create(input) {
      const v = validateTemplate(input);
      if (!v.valid) {
        throw new HttpError(400, 'VALIDATION_ERROR', v.errors.join(' '), v.errors);
      }
      const now = new Date().toISOString();
      const info = insertStmt.run(v.value.name, v.value.subject, v.value.body, now, now);
      return rowToTemplate(getByIdStmt.get(info.lastInsertRowid));
    },

    update(id, input) {
      const existing = getByIdStmt.get(id);
      if (!existing) return null;

      const v = validateTemplate(input, { isUpdate: true });
      if (!v.valid) {
        throw new HttpError(400, 'VALIDATION_ERROR', v.errors.join(' '), v.errors);
      }

      const name = v.value.name !== undefined ? v.value.name : existing.name;
      const subject = v.value.subject !== undefined ? v.value.subject : existing.subject;
      const body = v.value.body !== undefined ? v.value.body : existing.body;
      const now = new Date().toISOString();

      updateStmt.run(name, subject, body, now, id);
      return rowToTemplate(getByIdStmt.get(id));
    },

    delete(id) {
      const existing = getByIdStmt.get(id);
      if (!existing) return false;
      deleteStmt.run(id);
      return true;
    },
  };
}

module.exports = { createTemplateService, rowToTemplate };
