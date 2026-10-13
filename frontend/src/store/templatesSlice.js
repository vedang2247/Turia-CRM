import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createTemplate as createRequest, deleteTemplate as deleteRequest, listTemplates, updateTemplate as updateRequest } from '../services/crmApi';

export const fetchTemplates = createAsyncThunk('templates/fetch', (_, { rejectWithValue }) =>
  listTemplates().catch((error) => rejectWithValue(error.message)));
export const createTemplate = createAsyncThunk('templates/create', (body, { rejectWithValue }) => createRequest(body).catch((e) => rejectWithValue(e.message)));
export const updateTemplate = createAsyncThunk('templates/update', ({ id, ...body }, { rejectWithValue }) => updateRequest(id, body).catch((e) => rejectWithValue(e.message)));
export const deleteTemplate = createAsyncThunk('templates/delete', (id, { rejectWithValue }) => deleteRequest(id).then(() => id).catch((e) => rejectWithValue(e.message)));

const slice = createSlice({
  name: 'templates',
  initialState: { items: [], loading: false, saving: false, error: null },
  reducers: { clearError(state) { state.error = null; } },
  extraReducers: (builder) => {
    builder.addCase(fetchTemplates.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchTemplates.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchTemplates.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error.message; })
      .addCase(createTemplate.pending, (s) => { s.saving = true; s.error = null; })
      .addCase(createTemplate.fulfilled, (s, a) => { s.saving = false; s.items.unshift(a.payload); })
      .addCase(createTemplate.rejected, (s, a) => { s.saving = false; s.error = a.payload || a.error.message; })
      .addCase(updateTemplate.fulfilled, (s, a) => { s.saving = false; const i = s.items.findIndex((x) => x.id === a.payload.id); if (i >= 0) s.items[i] = a.payload; })
      .addCase(updateTemplate.rejected, (s, a) => { s.saving = false; s.error = a.payload || a.error.message; })
      .addCase(deleteTemplate.fulfilled, (s, a) => { s.saving = false; s.items = s.items.filter((x) => x.id !== a.payload); })
      .addCase(deleteTemplate.rejected, (s, a) => { s.saving = false; s.error = a.payload || a.error.message; });
  },
});
export const { clearError } = slice.actions;
export default slice.reducer;
