import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getChatStatuses, setChatStatus } from '../services/crmApi';
import { emitAck } from '../lib/socket';

export const syncChatStatuses = createAsyncThunk('whatsapp/syncStatuses', (chatIds, { rejectWithValue }) =>
  getChatStatuses(chatIds).then((data) => data.statuses).catch((error) => rejectWithValue(error.message)));
export const updateChatStatus = createAsyncThunk('whatsapp/updateStatus', ({ chatId, status }, { rejectWithValue }) =>
  setChatStatus(chatId, status).catch((error) => rejectWithValue(error.message)));
export const loadChats = createAsyncThunk('whatsapp/loadChats', (_, { getState, rejectWithValue }) => {
  if (getState().whatsapp.connection.state !== 'ready') return Promise.reject(new Error('WhatsApp is still connecting. Chats will load when it is ready.'));
  return emitAck('wa:getChats').then((result) => { if (!result?.ok) throw new Error(result?.error || 'Unable to load chats.'); return result.chats || []; }).catch((error) => rejectWithValue(error.message));
});
export const loadMessages = createAsyncThunk('whatsapp/loadMessages', (chatId, { getState, rejectWithValue }) => {
  if (getState().whatsapp.connection.state !== 'ready') return Promise.reject(new Error('WhatsApp is still connecting. Messages will load when it is ready.'));
  return emitAck('wa:getMessages', { chatId, limit: 50 }).then((result) => { if (!result?.ok) throw new Error(result?.error || 'Unable to load messages.'); return { chatId, messages: result.messages || [] }; }).catch((error) => rejectWithValue(error.message));
});
export const sendMessage = createAsyncThunk('whatsapp/sendMessage', ({ chatId, text }, { rejectWithValue }) =>
  emitAck('wa:send', { chatId, text }).then((result) => { if (!result?.ok) throw new Error(result?.error || 'Unable to send message.'); return result.message; }).catch((error) => rejectWithValue(error.message)));

const slice = createSlice({
  name: 'whatsapp',
  initialState: { connection: { state: 'disconnected', qrCode: null, clientInfo: null }, chats: [], selectedChatId: null, messages: {}, chatStatuses: {}, activeTab: 'all', searchQuery: '', loading: false, messagesLoading: false, error: null },
  reducers: {
    setConnection(state, action) { state.connection = { ...state.connection, ...action.payload }; },
    setChats(state, action) { state.chats = action.payload; },
    setMessages(state, action) { state.messages[action.payload.chatId] = action.payload.messages; },
    upsertMessage(state, action) {
      const { chatId, ...message } = action.payload;
      const messages = state.messages[chatId] || [];
      const index = messages.findIndex((item) => item.id === message.id);
      if (index >= 0) messages[index] = message; else messages.push(message);
      state.messages[chatId] = messages;
    },
    setSelectedChat(state, action) { state.selectedChatId = action.payload; },
    setActiveTab(state, action) { state.activeTab = action.payload; },
    setSearchQuery(state, action) { state.searchQuery = action.payload; },
    setChatStatuses(state, action) { state.chatStatuses = { ...state.chatStatuses, ...action.payload }; },
  },
  extraReducers: (builder) => {
    builder.addCase(syncChatStatuses.fulfilled, (s, a) => { s.chatStatuses = { ...s.chatStatuses, ...a.payload }; })
      .addCase(syncChatStatuses.rejected, (s, a) => { s.error = a.payload || a.error.message; })
      .addCase(updateChatStatus.fulfilled, (s, a) => { s.chatStatuses[a.meta.arg.chatId] = a.meta.arg.status; })
      .addCase(updateChatStatus.rejected, (s, a) => { s.error = a.payload || a.error.message; });
    builder.addCase(loadChats.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(loadChats.fulfilled, (s, a) => { s.loading = false; s.chats = a.payload; })
      .addCase(loadChats.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error.message; })
      .addCase(loadMessages.pending, (s) => { s.messagesLoading = true; })
      .addCase(loadMessages.fulfilled, (s, a) => { s.messagesLoading = false; s.messages[a.payload.chatId] = a.payload.messages; })
      .addCase(loadMessages.rejected, (s, a) => { s.messagesLoading = false; s.error = a.payload || a.error.message; })
      .addCase(sendMessage.fulfilled, (s, a) => { const chatId = a.payload.chatId; const list = s.messages[chatId] || []; list.push(a.payload); s.messages[chatId] = list; })
      .addCase(sendMessage.rejected, (s, a) => { s.error = a.payload || a.error.message; });
  },
});
export const { setConnection, setChats, setMessages, upsertMessage, setSelectedChat, setActiveTab, setSearchQuery, setChatStatuses } = slice.actions;
export default slice.reducer;
