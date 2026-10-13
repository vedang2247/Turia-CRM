import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getGmailProfile } from '../services/crmApi';

export const fetchGmailProfile = createAsyncThunk('connections/gmailProfile', (_, { rejectWithValue }) =>
  getGmailProfile().catch((error) => rejectWithValue(error.message)));

const slice = createSlice({
  name: 'connections',
  initialState: {
    gmail: { connected: false, email: null, checking: false, error: null },
    whatsapp: { state: 'disconnected', qrCode: null, clientInfo: null, error: null },
  },
  reducers: {
    setGmail(state, action) { state.gmail = { ...state.gmail, ...action.payload }; },
    setWhatsAppStatus(state, action) {
      state.whatsapp = { ...state.whatsapp, ...action.payload };
      if (action.payload.state && action.payload.state !== 'qr') state.whatsapp.qrCode = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchGmailProfile.pending, (s) => { s.gmail.checking = true; s.gmail.error = null; })
      .addCase(fetchGmailProfile.fulfilled, (s, a) => { s.gmail.checking = false; s.gmail.connected = Boolean(a.payload.connected); s.gmail.email = a.payload.email || null; })
      .addCase(fetchGmailProfile.rejected, (s, a) => { s.gmail.checking = false; s.gmail.connected = false; s.gmail.email = null; s.gmail.error = a.payload || a.error.message; });
  },
});
export const { setGmail, setWhatsAppStatus } = slice.actions;
export default slice.reducer;
