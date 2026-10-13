import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getEmailThread, listEmailThreads, sendGmailEmail } from '../services/crmApi';
import { listLinksByThread } from '../services/crmApi';

export const fetchEmailThreads = createAsyncThunk('email/fetchThreads', (options, { rejectWithValue }) =>
  listEmailThreads(options).catch((error) => rejectWithValue(error.message)));
export const fetchEmailThread = createAsyncThunk('email/fetchThread', (id, { rejectWithValue }) => getEmailThread(id).then((data) => ({ id, data })).catch((e) => rejectWithValue(e.message)));
export const sendEmail = createAsyncThunk('email/send', (body, { rejectWithValue }) => sendGmailEmail(body).catch((e) => rejectWithValue(e.message)));
export const fetchThreadLinks = createAsyncThunk('email/fetchThreadLinks', (threadId, { rejectWithValue }) =>
  listLinksByThread(threadId).then((links) => ({ threadId, links })).catch((e) => rejectWithValue(e.message)));

const slice = createSlice({
  name: 'email',
  initialState: { threads: [], selectedThreadId: null, selectedThread: null, nextPageToken: null, searchQuery: '', labelFilter: 'INBOX', loading: false, threadLoading: false, sending: false, error: null, linkedByThread: {} },
  reducers: {
    setSearchQuery(state, action) { state.searchQuery = action.payload; },
    setLabelFilter(state, action) { state.labelFilter = action.payload; },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchEmailThreads.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchEmailThreads.fulfilled, (s, a) => { s.loading = false; s.threads = a.payload.threads || []; s.nextPageToken = a.payload.nextPageToken || null; })
      .addCase(fetchEmailThreads.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error.message; })
      .addCase(fetchEmailThread.pending, (s) => { s.threadLoading = true; s.error = null; })
      .addCase(fetchEmailThread.fulfilled, (s, a) => { s.threadLoading = false; s.selectedThreadId = a.payload.id; s.selectedThread = a.payload.data; })
      .addCase(fetchEmailThread.rejected, (s, a) => { s.threadLoading = false; s.error = a.payload || a.error.message; })
      .addCase(sendEmail.pending, (s) => { s.sending = true; s.error = null; })
      .addCase(sendEmail.fulfilled, (s) => { s.sending = false; })
      .addCase(sendEmail.rejected, (s, a) => { s.sending = false; s.error = a.payload || a.error.message; });
    builder.addCase(fetchThreadLinks.fulfilled, (s, a) => { s.linkedByThread[a.payload.threadId] = a.payload.links; })
      .addCase(fetchThreadLinks.rejected, (s, a) => { s.error = a.payload || a.error.message; });
  },
});
export const { setSearchQuery, setLabelFilter, clearError } = slice.actions;
export default slice.reducer;
