// Business logic and SQL execution for CRM Tasks, Task Links, and Task Emails.
const {
  validateTask,
  validateTaskLink,
  validateTaskEmail,
  taskCode,
  TASK_STATUSES,
  TASK_PRIORITIES,
} = require('../validators/crmValidator');
const { HttpError } = require('../middleware/errorHandler');

function rowToTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: taskCode(row.id),
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    clientId: row.client_id,
    clientName: row.client_name || null,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name || null,
    reviewerId: row.reviewer_id,
    reviewerName: row.reviewer_name || null,
    linkCount: row.link_count !== undefined ? Number(row.link_count) : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToTaskLink(row) {
  if (!row) return null;
  return {
    id: row.id,
    taskId: row.task_id,
    type: row.type,
    chatId: row.chat_id,
    messageId: row.message_id,
    snapshot: row.snapshot,
    threadId: row.thread_id,
    subject: row.subject,
    sender: row.sender,
    note: row.note,
    createdAt: row.created_at,
  };
}

function rowToTaskEmail(row) {
  if (!row) return null;
  return {
    id: row.id,
    taskId: row.task_id,
    toAddress: row.to_address,
    subject: row.subject,
    bodyText: row.body_text,
    gmailMsgId: row.gmail_msg_id,
    threadId: row.thread_id,
    sentAt: row.sent_at,
  };
}

function createTaskService(db) {
  const getByIdStmt = db.prepare(`
    SELECT t.*,
           c.name AS client_name,
           a.name AS assignee_name,
           r.name AS reviewer_name,
           (SELECT COUNT(*) FROM task_links WHERE task_id = t.id) AS link_count
    FROM tasks t
    LEFT JOIN clients c ON t.client_id = c.id
    LEFT JOIN team_members a ON t.assignee_id = a.id
    LEFT JOIN team_members r ON t.reviewer_id = r.id
    WHERE t.id = ?
  `);

  const insertTaskStmt = db.prepare(`
    INSERT INTO tasks (title, description, status, priority, due_date, client_id, assignee_id, reviewer_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateTaskStmt = db.prepare(`
    UPDATE tasks
    SET title = ?, description = ?, status = ?, priority = ?, due_date = ?,
        client_id = ?, assignee_id = ?, reviewer_id = ?, updated_at = ?
    WHERE id = ?
  `);

  const deleteTaskStmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  const touchTaskStmt = db.prepare("UPDATE tasks SET updated_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) WHERE id = ?");

  const getLinksForTaskStmt = db.prepare('SELECT * FROM task_links WHERE task_id = ? ORDER BY created_at DESC, id DESC');
  const insertLinkStmt = db.prepare(`
    INSERT INTO task_links (task_id, type, chat_id, message_id, snapshot, thread_id, subject, sender, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const getLinkByIdStmt = db.prepare('SELECT * FROM task_links WHERE id = ?');
  const deleteLinkStmt = db.prepare('DELETE FROM task_links WHERE id = ? AND task_id = ?');

  const getEmailsForTaskStmt = db.prepare('SELECT * FROM task_emails WHERE task_id = ? ORDER BY sent_at DESC, id DESC');
  const insertEmailStmt = db.prepare(`
    INSERT INTO task_emails (task_id, to_address, subject, body_text, gmail_msg_id, thread_id, sent_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const getEmailByIdStmt = db.prepare('SELECT * FROM task_emails WHERE id = ?');

  return {
    list({ status = null, clientId = null, assigneeId = null, search = '', page = 1, limit = 20 } = {}) {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Math.min(100, Number(limit) || 20));
      const offset = (pageNum - 1) * limitNum;

      const conditions = [];
      const params = [];

      if (status && status !== 'all') {
        if (!TASK_STATUSES.includes(status)) {
          throw new HttpError(400, 'INVALID_FILTER', `Invalid status filter "${status}".`);
        }
        conditions.push('t.status = ?');
        params.push(status);
      }

      if (clientId && clientId !== 'all') {
        conditions.push('t.client_id = ?');
        params.push(Number(clientId));
      }

      if (assigneeId && assigneeId !== 'all') {
        conditions.push('t.assignee_id = ?');
        params.push(Number(assigneeId));
      }

      const q = typeof search === 'string' ? search.trim() : '';
      if (q) {
        const like = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
        conditions.push(`(
          lower(t.title) LIKE lower(?) ESCAPE '\\'
          OR lower(t.description) LIKE lower(?) ESCAPE '\\'
          OR lower(c.name) LIKE lower(?) ESCAPE '\\'
          OR ('TSK' || substr('0000' || t.id, -4)) LIKE ?
        )`);
        params.push(like, like, like, `%${q.toUpperCase()}%`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countSql = `
        SELECT COUNT(*) AS total
        FROM tasks t
        LEFT JOIN clients c ON t.client_id = c.id
        ${whereClause}
      `;
      const total = db.prepare(countSql).get(...params).total;

      const dataSql = `
        SELECT t.*,
               c.name AS client_name,
               a.name AS assignee_name,
               r.name AS reviewer_name,
               (SELECT COUNT(*) FROM task_links WHERE task_id = t.id) AS link_count
        FROM tasks t
        LEFT JOIN clients c ON t.client_id = c.id
        LEFT JOIN team_members a ON t.assignee_id = a.id
        LEFT JOIN team_members r ON t.reviewer_id = r.id
        ${whereClause}
        ORDER BY t.updated_at DESC, t.id DESC
        LIMIT ? OFFSET ?
      `;
      const rows = db.prepare(dataSql).all(...params, limitNum, offset);

      return {
        items: rows.map(rowToTask),
        total,
        page: pageNum,
        limit: limitNum,
      };
    },

    get(id) {
      const task = rowToTask(getByIdStmt.get(id));
      if (!task) return null;

      const links = getLinksForTaskStmt.all(id).map(rowToTaskLink);
      const sentEmails = getEmailsForTaskStmt.all(id).map(rowToTaskEmail);

      const client = task.clientId
        ? db.prepare('SELECT id, name, phone, email, company FROM clients WHERE id = ?').get(task.clientId) || null
        : null;

      const assignee = task.assigneeId
        ? db.prepare('SELECT id, name, email, avatar_url AS avatarUrl FROM team_members WHERE id = ?').get(task.assigneeId) || null
        : null;

      const reviewer = task.reviewerId
        ? db.prepare('SELECT id, name, email, avatar_url AS avatarUrl FROM team_members WHERE id = ?').get(task.reviewerId) || null
        : null;

      return {
        ...task,
        client,
        assignee,
        reviewer,
        links,
        sentEmails,
      };
    },

    create(input) {
      const v = validateTask(input);
      if (!v.valid) {
        throw new HttpError(400, 'VALIDATION_ERROR', v.errors.join(' '), v.errors);
      }
      const now = new Date().toISOString();
      const { title, description, status, priority, dueDate, clientId, assigneeId, reviewerId } = v.value;

      const info = insertTaskStmt.run(
        title,
        description,
        status,
        priority,
        dueDate,
        clientId,
        assigneeId,
        reviewerId,
        now,
        now
      );

      return this.get(info.lastInsertRowid);
    },

    update(id, input) {
      const existing = getByIdStmt.get(id);
      if (!existing) return null;

      const v = validateTask(input, { isUpdate: true });
      if (!v.valid) {
        throw new HttpError(400, 'VALIDATION_ERROR', v.errors.join(' '), v.errors);
      }

      const title = v.value.title !== undefined ? v.value.title : existing.title;
      const description = v.value.description !== undefined ? v.value.description : existing.description;
      const status = v.value.status !== undefined ? v.value.status : existing.status;
      const priority = v.value.priority !== undefined ? v.value.priority : existing.priority;
      const dueDate = v.value.dueDate !== undefined ? v.value.dueDate : existing.due_date;
      const clientId = v.value.clientId !== undefined ? v.value.clientId : existing.client_id;
      const assigneeId = v.value.assigneeId !== undefined ? v.value.assigneeId : existing.assignee_id;
      const reviewerId = v.value.reviewerId !== undefined ? v.value.reviewerId : existing.reviewer_id;
      const now = new Date().toISOString();

      updateTaskStmt.run(title, description, status, priority, dueDate, clientId, assigneeId, reviewerId, now, id);
      return this.get(id);
    },

    delete(id) {
      const existing = getByIdStmt.get(id);
      if (!existing) return false;
      deleteTaskStmt.run(id);
      return true;
    },

    addLink(taskId, input) {
      const task = getByIdStmt.get(taskId);
      if (!task) throw new HttpError(404, 'NOT_FOUND', 'Task not found.');

      const v = validateTaskLink(input);
      if (!v.valid) {
        throw new HttpError(400, 'VALIDATION_ERROR', v.errors.join(' '), v.errors);
      }

      const now = new Date().toISOString();
      const { type, chatId, messageId, snapshot, threadId, subject, sender, note } = v.value;

      const info = insertLinkStmt.run(
        taskId,
        type,
        chatId,
        messageId,
        snapshot,
        threadId,
        subject,
        sender,
        note,
        now
      );

      touchTaskStmt.run(taskId);
      return rowToTaskLink(getLinkByIdStmt.get(info.lastInsertRowid));
    },

    removeLink(taskId, linkId) {
      const task = getByIdStmt.get(taskId);
      if (!task) throw new HttpError(404, 'NOT_FOUND', 'Task not found.');

      const link = getLinkByIdStmt.get(linkId);
      if (!link || link.task_id !== taskId) throw new HttpError(404, 'NOT_FOUND', 'Task link not found.');

      deleteLinkStmt.run(linkId, taskId);
      touchTaskStmt.run(taskId);
      return true;
    },

    getLinksByChat(chatId) {
      if (!chatId) return {};
      const rows = db.prepare(`
        SELECT l.message_id, l.task_id, t.title
        FROM task_links l
        JOIN tasks t ON l.task_id = t.id
        WHERE l.type = 'whatsapp' AND l.chat_id = ?
      `).all(chatId);

      const mapping = {};
      for (const r of rows) {
        if (r.message_id) {
          mapping[r.message_id] = {
            taskId: r.task_id,
            taskCode: taskCode(r.task_id),
            title: r.title,
          };
        }
      }
      return mapping;
    },

    getLinksByThread(threadId) {
      if (!threadId) return [];
      const rows = db.prepare(`
        SELECT l.task_id, t.title
        FROM task_links l
        JOIN tasks t ON l.task_id = t.id
        WHERE l.type = 'email' AND l.thread_id = ?
      `).all(threadId);

      return rows.map((r) => ({
        taskId: r.task_id,
        taskCode: taskCode(r.task_id),
        title: r.title,
      }));
    },

    recordEmail(taskId, input) {
      const task = getByIdStmt.get(taskId);
      if (!task) throw new HttpError(404, 'NOT_FOUND', 'Task not found.');

      const v = validateTaskEmail(input);
      if (!v.valid) {
        throw new HttpError(400, 'VALIDATION_ERROR', v.errors.join(' '), v.errors);
      }

      const now = new Date().toISOString();
      const { toAddress, subject, bodyText, gmailMsgId, threadId } = v.value;

      let taskEmail;
      let taskLink;

      db.transaction(() => {
        const emailInfo = insertEmailStmt.run(
          taskId,
          toAddress,
          subject,
          bodyText,
          gmailMsgId,
          threadId,
          now
        );
        taskEmail = rowToTaskEmail(getEmailByIdStmt.get(emailInfo.lastInsertRowid));

        if (threadId) {
          const linkInfo = insertLinkStmt.run(
            taskId,
            'email',
            null,
            null,
            null,
            threadId,
            subject,
            toAddress,
            'Sent from task',
            now
          );
          taskLink = rowToTaskLink(getLinkByIdStmt.get(linkInfo.lastInsertRowid));
        }

        touchTaskStmt.run(taskId);
      })();

      return { taskEmail, taskLink: taskLink || null };
    },
  };
}

module.exports = { createTaskService, rowToTask, rowToTaskLink, rowToTaskEmail };
