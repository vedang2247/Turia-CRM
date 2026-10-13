import { api, localApi } from './api';

const json = (method, body) => ({
  method,
  body: JSON.stringify(body),
});

const query = (values) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const text = params.toString();
  return text ? `?${text}` : '';
};

export const listClients = (q = '') => api(`/clients${query({ q })}`);
export const createClient = (body) => api('/clients', json('POST', body));
export const matchClient = ({ phone, email } = {}) => api(`/clients/match${query({ phone, email })}`);
export const listTeamMembers = () => api('/team');

export const listTasks = (filters = {}) => api(`/tasks${query({
  status: filters.status,
  clientId: filters.clientId,
  assigneeId: filters.assigneeId,
  q: filters.q || filters.search,
  page: filters.page,
  limit: filters.limit,
})}`);
export const getTask = (id) => api(`/tasks/${id}`);
export const createTask = (body) => api('/tasks', json('POST', body));
export const updateTask = (id, body) => api(`/tasks/${id}`, json('PATCH', body));
export const deleteTask = (id) => api(`/tasks/${id}`, { method: 'DELETE' });
export const addTaskLink = (taskId, body) => api(`/tasks/${taskId}/links`, json('POST', body));
export const removeTaskLink = (taskId, linkId) => api(`/tasks/${taskId}/links/${linkId}`, { method: 'DELETE' });
export const listLinksByChat = (chatId) => api(`/tasks/links/by-chat${query({ chatId })}`);
export const listLinksByThread = (threadId) => api(`/tasks/links/by-thread${query({ threadId })}`);
export const recordTaskEmail = (taskId, body) => api(`/tasks/${taskId}/emails`, json('POST', body));

export const listTemplates = () => api('/templates');
export const createTemplate = (body) => api('/templates', json('POST', body));
export const updateTemplate = (id, body) => api(`/templates/${id}`, json('PATCH', body));
export const deleteTemplate = (id) => api(`/templates/${id}`, { method: 'DELETE' });

export const getChatStatuses = (chatIds) => api(`/chats/status${query({ chatIds: chatIds.join(',') })}`);
export const setChatStatus = (chatId, status) => api('/chats/status', json('PATCH', { chatId, status }));

export const getGmailProfile = () => localApi('/api/gmail/profile');
export const listEmailThreads = ({ q = '', pageToken = '' } = {}) =>
  localApi(`/api/gmail/threads${query({ q, pageToken })}`);
export const getEmailThread = (id) => localApi(`/api/gmail/threads/${encodeURIComponent(id)}`);
export const sendGmailEmail = (body) => localApi('/api/gmail/send', json('POST', body));

export const searchTasks = (q = '') => listTasks({ q, limit: 20, page: 1 });
