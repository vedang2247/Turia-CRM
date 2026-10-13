// Business logic and SQL execution for Chat Statuses (persisted in SQLite).
const { validateChatStatus } = require('../validators/crmValidator');
const { HttpError } = require('../middleware/errorHandler');

function createChatStatusService(db) {
  const getStmt = db.prepare('SELECT chat_id, status FROM chat_statuses WHERE chat_id = ?');
  const upsertStmt = db.prepare(`
    INSERT INTO chat_statuses (chat_id, status, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(chat_id) DO UPDATE SET
      status = excluded.status,
      updated_at = excluded.updated_at
  `);

  return {
    getStatuses(chatIds = []) {
      const statuses = {};
      if (!Array.isArray(chatIds) || chatIds.length === 0) return statuses;

      const placeholders = chatIds.map(() => '?').join(',');
      const rows = db.prepare(`SELECT chat_id, status FROM chat_statuses WHERE chat_id IN (${placeholders})`).all(...chatIds);
      for (const row of rows) {
        statuses[row.chat_id] = row.status;
      }
      return statuses;
    },

    setStatus(chatId, status) {
      const v = validateChatStatus({ chatId, status });
      if (!v.valid) {
        throw new HttpError(400, 'VALIDATION_ERROR', v.errors.join(' '), v.errors);
      }
      const now = new Date().toISOString();
      upsertStmt.run(v.value.chatId, v.value.status, now);
      return { ok: true, chatId: v.value.chatId, status: v.value.status };
    },
  };
}

module.exports = { createChatStatusService };
