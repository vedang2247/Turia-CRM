// Controllers for CRM resources (Clients, Team, Templates, Chat Statuses, Tasks).
const { createClientService } = require('../services/clientService');
const { createTeamService } = require('../services/teamService');
const { createTemplateService } = require('../services/templateService');
const { createChatStatusService } = require('../services/chatStatusService');
const { createTaskService } = require('../services/taskService');
const { HttpError } = require('../middleware/errorHandler');

function parseId(raw, entity = 'Resource') {
  const text = String(raw);
  const id = Number(text);
  if (!/^[1-9]\d*$/.test(text) || !Number.isSafeInteger(id)) {
    throw new HttpError(400, 'INVALID_ID', `${entity} id must be a positive whole number.`);
  }
  return id;
}

function queryText(v) {
  return typeof v === 'string' ? v : '';
}

function createCrmControllers(db) {
  const clientService = createClientService(db);
  const teamService = createTeamService(db);
  const templateService = createTemplateService(db);
  const chatStatusService = createChatStatusService(db);
  const taskService = createTaskService(db);

  return {
    clients: {
      list(req, res) {
        const data = clientService.list({ search: queryText(req.query.q) });
        res.json({ success: true, data });
      },
      get(req, res) {
        const client = clientService.get(parseId(req.params.id, 'Client'));
        if (!client) throw new HttpError(404, 'NOT_FOUND', 'Client not found.');
        res.json({ success: true, data: client });
      },
      match(req, res) {
        const phone = queryText(req.query.phone);
        const email = queryText(req.query.email);
        if (!phone && !email) {
          throw new HttpError(400, 'MISSING_PARAM', 'Query parameter phone or email is required.');
        }
        const data = clientService.match({ phone, email });
        res.json({ success: true, data });
      },
      create(req, res) {
        const client = clientService.create(req.body);
        res.status(201).json({ success: true, data: client });
      },
    },

    team: {
      list(req, res) {
        const data = teamService.list();
        res.json({ success: true, data });
      },
    },

    templates: {
      list(req, res) {
        const data = templateService.list();
        res.json({ success: true, data });
      },
      get(req, res) {
        const template = templateService.get(parseId(req.params.id, 'Template'));
        if (!template) throw new HttpError(404, 'NOT_FOUND', 'Template not found.');
        res.json({ success: true, data: template });
      },
      create(req, res) {
        const template = templateService.create(req.body);
        res.status(201).json({ success: true, data: template });
      },
      update(req, res) {
        const template = templateService.update(parseId(req.params.id, 'Template'), req.body);
        if (!template) throw new HttpError(404, 'NOT_FOUND', 'Template not found.');
        res.json({ success: true, data: template });
      },
      delete(req, res) {
        const id = parseId(req.params.id, 'Template');
        const deleted = templateService.delete(id);
        if (!deleted) throw new HttpError(404, 'NOT_FOUND', 'Template not found.');
        res.json({ success: true, data: { id, deleted: true } });
      },
    },

    chats: {
      getStatus(req, res) {
        const raw = queryText(req.query.chatIds);
        const chatIds = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
        const statuses = chatStatusService.getStatuses(chatIds);
        res.json({ success: true, data: { statuses } });
      },
      setStatus(req, res) {
        const { chatId, status } = req.body || {};
        const result = chatStatusService.setStatus(chatId, status);
        res.json({ success: true, data: result });
      },
    },

    tasks: {
      list(req, res) {
        const data = taskService.list({
          status: queryText(req.query.status) || null,
          clientId: queryText(req.query.clientId) || null,
          assigneeId: queryText(req.query.assigneeId) || null,
          search: queryText(req.query.q) || queryText(req.query.search),
          page: req.query.page,
          limit: req.query.limit,
        });
        res.json({ success: true, data });
      },
      get(req, res) {
        const task = taskService.get(parseId(req.params.id, 'Task'));
        if (!task) throw new HttpError(404, 'NOT_FOUND', 'Task not found.');
        res.json({ success: true, data: task });
      },
      create(req, res) {
        const task = taskService.create(req.body);
        res.status(201).json({ success: true, data: task });
      },
      update(req, res) {
        const task = taskService.update(parseId(req.params.id, 'Task'), req.body);
        if (!task) throw new HttpError(404, 'NOT_FOUND', 'Task not found.');
        res.json({ success: true, data: task });
      },
      delete(req, res) {
        const id = parseId(req.params.id, 'Task');
        const deleted = taskService.delete(id);
        if (!deleted) throw new HttpError(404, 'NOT_FOUND', 'Task not found.');
        res.json({ success: true, data: { id, deleted: true } });
      },
      addLink(req, res) {
        const taskId = parseId(req.params.id, 'Task');
        const link = taskService.addLink(taskId, req.body);
        res.status(201).json({ success: true, data: link });
      },
      removeLink(req, res) {
        const taskId = parseId(req.params.id, 'Task');
        const linkId = parseId(req.params.linkId, 'Link');
        taskService.removeLink(taskId, linkId);
        res.json({ success: true, data: { id: linkId, deleted: true } });
      },
      getLinksByChat(req, res) {
        const chatId = queryText(req.query.chatId);
        if (!chatId) throw new HttpError(400, 'MISSING_PARAM', 'Query parameter chatId is required.');
        const data = taskService.getLinksByChat(chatId);
        res.json({ success: true, data });
      },
      getLinksByThread(req, res) {
        const threadId = queryText(req.query.threadId);
        if (!threadId) throw new HttpError(400, 'MISSING_PARAM', 'Query parameter threadId is required.');
        const data = taskService.getLinksByThread(threadId);
        res.json({ success: true, data });
      },
      recordEmail(req, res) {
        const taskId = parseId(req.params.id, 'Task');
        const data = taskService.recordEmail(taskId, req.body);
        res.status(201).json({ success: true, data });
      },
    },
  };
}

module.exports = { createCrmControllers, parseId };
