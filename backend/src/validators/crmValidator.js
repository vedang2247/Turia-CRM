// Server-side validation for CRM entities (Clients, Tasks, Links, Templates, Chat Status).
const TASK_STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const LINK_TYPES = ['whatsapp', 'email'];
const CHAT_STATUSES = ['open', 'resolved'];

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isBlank = (v) => typeof v !== 'string' || !v.trim();

function normalisePhone(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.replace(/@(c|g)\.us$/, '').replace(/[\s+\-()]/g, '');
  return cleaned.length > 0 ? cleaned : null;
}

function extractEmail(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const match = raw.match(/<([^>]+)>/);
  const email = (match ? match[1] : raw).trim().toLowerCase();
  return email.length > 0 ? email : null;
}

function taskCode(id) {
  return 'TSK' + String(id).padStart(4, '0');
}

function validateClient(input) {
  if (!isPlainObject(input)) {
    return { valid: false, errors: ['Request body must be a JSON object.'], value: null };
  }
  const errors = [];
  if (isBlank(input.name)) {
    errors.push('Client name is required.');
  } else if (input.name.trim().length > 150) {
    errors.push('Client name must be 150 characters or fewer.');
  }

  const phone = input.phone ? normalisePhone(input.phone) : null;
  if (input.phone && !phone) {
    errors.push('Invalid phone number format.');
  }

  const email = input.email ? extractEmail(input.email) : null;
  if (input.email && !email) {
    errors.push('Invalid email address format.');
  }

  const company = typeof input.company === 'string' && input.company.trim() ? input.company.trim() : null;

  if (errors.length) return { valid: false, errors, value: null };

  return {
    valid: true,
    errors: [],
    value: {
      name: input.name.trim(),
      phone,
      email,
      company,
    },
  };
}

function validateTask(input, { isUpdate = false } = {}) {
  if (!isPlainObject(input)) {
    return { valid: false, errors: ['Request body must be a JSON object.'], value: null };
  }
  const errors = [];
  const value = {};

  if (!isUpdate || input.title !== undefined) {
    if (isBlank(input.title)) {
      errors.push('Task title is required.');
    } else if (input.title.trim().length > 300) {
      errors.push('Task title must be 300 characters or fewer.');
    } else {
      value.title = input.title.trim();
    }
  }

  if (input.description !== undefined) {
    value.description = typeof input.description === 'string' ? input.description.trim() : null;
  } else if (!isUpdate) {
    value.description = null;
  }

  if (input.status !== undefined) {
    if (!TASK_STATUSES.includes(input.status)) {
      errors.push(`Status must be one of: ${TASK_STATUSES.join(', ')}.`);
    } else {
      value.status = input.status;
    }
  } else if (!isUpdate) {
    value.status = 'open';
  }

  if (input.priority !== undefined) {
    if (!TASK_PRIORITIES.includes(input.priority)) {
      errors.push(`Priority must be one of: ${TASK_PRIORITIES.join(', ')}.`);
    } else {
      value.priority = input.priority;
    }
  } else if (!isUpdate) {
    value.priority = 'medium';
  }

  if (input.dueDate !== undefined) {
    value.dueDate = input.dueDate ? String(input.dueDate).trim() : null;
  } else if (!isUpdate) {
    value.dueDate = null;
  }

  if (input.clientId !== undefined) {
    value.clientId = input.clientId ? Number(input.clientId) : null;
  } else if (!isUpdate) {
    value.clientId = null;
  }

  if (input.assigneeId !== undefined) {
    value.assigneeId = input.assigneeId ? Number(input.assigneeId) : null;
  } else if (!isUpdate) {
    value.assigneeId = null;
  }

  if (input.reviewerId !== undefined) {
    value.reviewerId = input.reviewerId ? Number(input.reviewerId) : null;
  } else if (!isUpdate) {
    value.reviewerId = null;
  }

  if (errors.length) return { valid: false, errors, value: null };
  return { valid: true, errors: [], value };
}

function validateTaskLink(input) {
  if (!isPlainObject(input)) {
    return { valid: false, errors: ['Request body must be a JSON object.'], value: null };
  }
  const errors = [];

  if (!LINK_TYPES.includes(input.type)) {
    errors.push(`Link type must be one of: ${LINK_TYPES.join(', ')}.`);
  }

  if (input.type === 'whatsapp') {
    if (isBlank(input.chatId)) errors.push('chatId is required for WhatsApp links.');
    if (isBlank(input.snapshot)) errors.push('snapshot is required for WhatsApp links.');
  } else if (input.type === 'email') {
    if (isBlank(input.threadId)) errors.push('threadId is required for email links.');
  }

  if (errors.length) return { valid: false, errors, value: null };

  return {
    valid: true,
    errors: [],
    value: {
      type: input.type,
      chatId: input.chatId ? String(input.chatId).trim() : null,
      messageId: input.messageId ? String(input.messageId).trim() : null,
      snapshot: input.snapshot ? String(input.snapshot).trim() : null,
      threadId: input.threadId ? String(input.threadId).trim() : null,
      subject: input.subject ? String(input.subject).trim() : null,
      sender: input.sender ? extractEmail(input.sender) : null,
      note: input.note ? String(input.note).trim() : null,
    },
  };
}

function validateTaskEmail(input) {
  if (!isPlainObject(input)) {
    return { valid: false, errors: ['Request body must be a JSON object.'], value: null };
  }
  const errors = [];
  const toAddress = input.toAddress || input.to;

  if (isBlank(toAddress)) {
    errors.push('Recipient email address (toAddress) is required.');
  }
  if (isBlank(input.subject)) {
    errors.push('Email subject is required.');
  }
  if (isBlank(input.bodyText)) {
    errors.push('Email bodyText is required.');
  }

  if (errors.length) return { valid: false, errors, value: null };

  return {
    valid: true,
    errors: [],
    value: {
      toAddress: extractEmail(toAddress),
      subject: String(input.subject).trim(),
      bodyText: String(input.bodyText).trim(),
      gmailMsgId: input.gmailMsgId ? String(input.gmailMsgId).trim() : null,
      threadId: input.threadId ? String(input.threadId).trim() : null,
    },
  };
}

function validateTemplate(input, { isUpdate = false } = {}) {
  if (!isPlainObject(input)) {
    return { valid: false, errors: ['Request body must be a JSON object.'], value: null };
  }
  const errors = [];
  const value = {};

  if (!isUpdate || input.name !== undefined) {
    if (isBlank(input.name)) {
      errors.push('Template name is required.');
    } else if (input.name.trim().length > 150) {
      errors.push('Template name must be 150 characters or fewer.');
    } else {
      value.name = input.name.trim();
    }
  }

  if (!isUpdate || input.subject !== undefined) {
    if (isBlank(input.subject)) {
      errors.push('Template subject is required.');
    } else {
      value.subject = input.subject.trim();
    }
  }

  if (!isUpdate || input.body !== undefined) {
    if (isBlank(input.body)) {
      errors.push('Template body is required.');
    } else {
      value.body = input.body.trim();
    }
  }

  if (errors.length) return { valid: false, errors, value: null };
  return { valid: true, errors: [], value };
}

function validateChatStatus(input) {
  if (!isPlainObject(input)) {
    return { valid: false, errors: ['Request body must be a JSON object.'], value: null };
  }
  const errors = [];
  if (isBlank(input.chatId)) errors.push('chatId is required.');
  if (!CHAT_STATUSES.includes(input.status)) {
    errors.push(`Status must be one of: ${CHAT_STATUSES.join(', ')}.`);
  }

  if (errors.length) return { valid: false, errors, value: null };
  return {
    valid: true,
    errors: [],
    value: {
      chatId: input.chatId.trim(),
      status: input.status,
    },
  };
}

module.exports = {
  TASK_STATUSES,
  TASK_PRIORITIES,
  LINK_TYPES,
  CHAT_STATUSES,
  normalisePhone,
  extractEmail,
  taskCode,
  validateClient,
  validateTask,
  validateTaskLink,
  validateTaskEmail,
  validateTemplate,
  validateChatStatus,
};
