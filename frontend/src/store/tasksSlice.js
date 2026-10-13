import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  addTaskLink, createTask as createTaskRequest, deleteTask as deleteTaskRequest,
  getTask, listClients, listLinksByChat, listLinksByThread, listTasks, listTeamMembers, recordTaskEmail,
  removeTaskLink, searchTasks, updateTask as updateTaskRequest,
} from '../services/crmApi';

const message = (action) => action.payload || action.error.message;

export const fetchTasks = createAsyncThunk('tasks/fetch', (filters, { getState, rejectWithValue }) => {
  const state = getState().tasks;
  return listTasks({ ...state.filters, page: state.page, limit: state.limit, ...filters })
    .catch((error) => rejectWithValue(error.message));
});
export const fetchTask = createAsyncThunk('tasks/fetchOne', (id, { rejectWithValue }) =>
  getTask(id).catch((error) => rejectWithValue(error.message)));
export const fetchClients = createAsyncThunk('tasks/fetchClients', (_, { rejectWithValue }) =>
  listClients().catch((error) => rejectWithValue(error.message)));
export const fetchTeamMembers = createAsyncThunk('tasks/fetchTeamMembers', (_, { rejectWithValue }) =>
  listTeamMembers().catch((error) => rejectWithValue(error.message)));
export const createTask = createAsyncThunk('tasks/create', (body, { rejectWithValue }) =>
  createTaskRequest(body).catch((error) => rejectWithValue(error.message)));
export const updateTask = createAsyncThunk('tasks/update', ({ id, ...body }, { rejectWithValue }) =>
  updateTaskRequest(id, body).catch((error) => rejectWithValue(error.message)));
export const deleteTask = createAsyncThunk('tasks/delete', (id, { rejectWithValue }) =>
  deleteTaskRequest(id).then(() => id).catch((error) => rejectWithValue(error.message)));
export const addLink = createAsyncThunk('tasks/addLink', ({ taskId, ...body }, { rejectWithValue }) =>
  addTaskLink(taskId, body).then((link) => ({ taskId, link })).catch((error) => rejectWithValue(error.message)));
export const removeLink = createAsyncThunk('tasks/removeLink', ({ taskId, linkId }, { rejectWithValue }) =>
  removeTaskLink(taskId, linkId).then(() => ({ taskId, linkId })).catch((error) => rejectWithValue(error.message)));
export const recordEmail = createAsyncThunk('tasks/recordEmail', ({ taskId, ...body }, { rejectWithValue }) =>
  recordTaskEmail(taskId, body).then((data) => ({ taskId, data })).catch((error) => rejectWithValue(error.message)));
export const fetchLinksByChat = createAsyncThunk('tasks/linksByChat', (chatId, { rejectWithValue }) =>
  listLinksByChat(chatId).then((links) => ({ chatId, links: Array.isArray(links) ? links : Object.values(links || {}) })).catch((error) => rejectWithValue(error.message)));
export const fetchLinksByThread = createAsyncThunk('tasks/linksByThread', (threadId, { rejectWithValue }) =>
  listLinksByThread(threadId).then((links) => ({ threadId, links })).catch((error) => rejectWithValue(error.message)));
export const findTasks = createAsyncThunk('tasks/find', (q, { rejectWithValue }) =>
  searchTasks(q).catch((error) => rejectWithValue(error.message)));

const initialState = {
  items: [], total: 0, page: 1, limit: 20, selectedTask: null,
  filters: { status: 'all', assigneeId: 'all', clientId: 'all', search: '' },
  clients: [], teamMembers: [],
  searchResults: [],
  loading: false, detailLoading: false, saving: false, error: null, detailError: null,
  linkedByChat: {}, linkedByThread: {},
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilters(state, action) { state.filters = { ...state.filters, ...action.payload }; state.page = 1; },
    setPage(state, action) { state.page = action.payload; },
    clearError(state) { state.error = null; },
    clearDetailError(state) { state.detailError = null; },
    clearSelectedTask(state) { state.selectedTask = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false; state.items = action.payload.items; state.total = action.payload.total;
        state.page = action.payload.page; state.limit = action.payload.limit;
      })
      .addCase(fetchTasks.rejected, (state, action) => { state.loading = false; state.error = message(action); })
      .addCase(fetchTask.pending, (state) => { state.detailLoading = true; state.detailError = null; })
      .addCase(fetchTask.fulfilled, (state, action) => { state.detailLoading = false; state.selectedTask = action.payload; })
      .addCase(fetchTask.rejected, (state, action) => { state.detailLoading = false; state.detailError = message(action); })
      .addCase(fetchClients.fulfilled, (state, action) => { state.clients = action.payload; })
      .addCase(fetchTeamMembers.fulfilled, (state, action) => { state.teamMembers = action.payload; })
      .addCase(createTask.fulfilled, (state, action) => { state.items.unshift(action.payload); state.total += 1; })
      .addCase(updateTask.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.saving = false; state.selectedTask = action.payload;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = { ...state.items[index], ...action.payload };
      })
      .addCase(updateTask.rejected, (state, action) => { state.saving = false; state.error = message(action); })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
        if (state.selectedTask?.id === action.payload) state.selectedTask = null;
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(addLink.fulfilled, (state, action) => {
        if (state.selectedTask?.id === action.payload.taskId) state.selectedTask.links.unshift(action.payload.link);
      })
      .addCase(removeLink.fulfilled, (state, action) => {
        if (state.selectedTask?.id === action.payload.taskId) {
          state.selectedTask.links = state.selectedTask.links.filter((link) => link.id !== action.payload.linkId);
        }
      })
      .addCase(recordEmail.fulfilled, (state, action) => {
        if (state.selectedTask?.id === action.payload.taskId) {
          state.selectedTask.sentEmails.unshift(action.payload.data.taskEmail);
          state.selectedTask.links.unshift(action.payload.data.taskLink);
        }
      })
      .addCase(fetchLinksByChat.fulfilled, (state, action) => { state.linkedByChat[action.payload.chatId] = action.payload.links; })
      .addCase(fetchLinksByThread.fulfilled, (state, action) => { state.linkedByThread[action.payload.threadId] = action.payload.links; });
    builder.addCase(findTasks.fulfilled, (state, action) => { state.searchResults = action.payload.items; })
      .addCase(findTasks.rejected, (state, action) => { state.error = message(action); });
  },
});

export const { setFilters, setPage, clearError, clearDetailError, clearSelectedTask } = tasksSlice.actions;
export default tasksSlice.reducer;
