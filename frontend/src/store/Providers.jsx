'use client';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { store } from './store';
import { getSocket } from '../lib/socket';
import { setChats, setConnection, upsertMessage } from './whatsappSlice';
import { setWhatsAppStatus } from './connectionsSlice';
import { syncChatStatuses } from './whatsappSlice';

function SocketBridge() {
  useEffect(() => {
    const socket = getSocket();
    const status = (payload) => { const value = { state: payload.state, qrCode: payload.qr || null, clientInfo: payload.me || null, error: payload.error || null }; store.dispatch(setConnection(value)); store.dispatch(setWhatsAppStatus(value)); };
    const chats = (payload) => { store.dispatch(setChats(payload)); store.dispatch(syncChatStatuses(payload.map((chat) => chat.id))); };
    socket.on('wa:status', status);
    socket.on('wa:chats', chats);
    socket.on('wa:message', (message) => store.dispatch(upsertMessage(message)));
    socket.connect();
    return () => { socket.off('wa:status', status); socket.off('wa:chats', chats); socket.disconnect(); };
  }, []);
  return null;
}

export function Providers({ children }) { return <Provider store={store}><SocketBridge />{children}</Provider>; }
