import 'dotenv/config';
import http from 'node:http';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';
import whatsapp from 'whatsapp-web.js';

const port = Number(process.env.PORT || 4001);
const origin = process.env.WEB_ORIGIN || 'http://localhost:3000';
const state = { state: 'disconnected', qr: null, me: null, error: null, chats: [], chatsLoading: false };
const app = express();
app.use(cors({ origin }));
app.get('/health', (_req, res) => res.json({ ok: true, whatsapp: state }));
const server = http.createServer(app);
const io = new Server(server, { cors: { origin } });
const { Client, LocalAuth } = whatsapp;
const client = new Client({ authStrategy: new LocalAuth(), puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] } });

function broadcast() { io.emit('wa:status', state); }
function errorDetails(error) {
  return {
    message: error instanceof Error ? error.message : String(error),
    name: error?.name || 'Error',
    stack: error?.stack || null,
  };
}
function formatMessage(message) {
  return { id: message.id._serialized, chatId: message.fromMe ? message.to : message.from, body: message.body || '[Media message]', fromMe: message.fromMe, timestamp: (message.timestamp || Date.now() / 1000) * 1000, ack: message.ack || 0, hasMedia: Boolean(message.hasMedia), type: message.type || 'chat' };
}
async function chats() {
  if (state.chats.length) return state.chats;
  if (state.chatsLoading) return state.chats;
  state.chatsLoading = true;
  try {
    try {
      state.chats = (await client.getChats()).filter((chat) => chat.id._serialized !== 'status@broadcast').slice(0, 40).map((chat) => ({ id: chat.id._serialized, name: chat.name || chat.id.user, isGroup: chat.isGroup, unreadCount: chat.unreadCount, timestamp: chat.timestamp, lastMessage: chat.lastMessage ? { body: chat.lastMessage.body || '[Media message]', fromMe: chat.lastMessage.fromMe } : null }));
    } catch (error) {
      const details = errorDetails(error);
      console.warn('[wa:getChats] standard extraction failed; using compatibility fallback', details);
      const rawChats = await client.pupPage.evaluate(() => window.require('WAWebCollections').Chat.getModelsArray().slice(0, 40).map((chat) => ({
        id: chat.id?._serialized || chat.id?.toString?.() || chat.__x_id?._serialized,
        name: chat.name || chat.formattedTitle || chat.contact?.name || chat.contact?.pushname || chat.id?.user,
        isGroup: Boolean(chat.isGroup || chat.__x_isGroup),
        unreadCount: chat.unreadCount || 0,
        timestamp: chat.t || chat.timestamp || 0,
        lastMessage: chat.lastReceivedKey ? null : null,
      })));
      state.chats = rawChats.filter((chat) => chat.id && chat.id !== 'status@broadcast');
    }
    return state.chats;
  } finally {
    state.chatsLoading = false;
  }
}
async function messagesForChat(chatId, limit) {
  const chat = await client.getChatById(chatId);
  return (await chat.fetchMessages({ limit })).map(formatMessage);
}
client.on('qr', (qr) => { state.state = 'qr'; state.qr = qr; state.error = null; broadcast(); });
client.on('authenticated', () => { state.state = 'authenticating'; state.qr = null; broadcast(); });
client.on('ready', () => { state.state = 'ready'; state.qr = null; state.me = { number: client.info.wid.user, name: client.info.pushname }; broadcast(); chats().then((list) => io.emit('wa:chats', list)).catch((error) => { state.error = error.message; broadcast(); }); });
client.on('disconnected', (reason) => { state.state = 'disconnected'; state.me = null; state.error = String(reason); broadcast(); });
client.on('message', (message) => io.emit('wa:message', formatMessage(message)));
io.on('connection', (socket) => {
  socket.emit('wa:status', state);
  socket.on('wa:getChats', async (ack) => {
    if (state.state !== 'ready') return ack?.({ ok: false, error: `WhatsApp client is ${state.state}.` });
    try { const list = await chats(); socket.emit('wa:chats', list); ack?.({ ok: true, chats: list }); }
    catch (error) { const details = errorDetails(error); console.error('[wa:getChats]', details); state.error = details.message; broadcast(); ack?.({ ok: false, error: 'Unable to load WhatsApp chats.', details }); }
  });
  socket.on('wa:getMessages', async ({ chatId, limit = 50 } = {}, ack) => {
    if (state.state !== 'ready') return ack?.({ ok: false, error: `WhatsApp client is ${state.state}.` });
    try {
      const messages = await messagesForChat(chatId, limit);
      ack?.({ ok: true, messages });
    } catch (error) {
      const details = errorDetails(error);
      console.warn('[wa:getMessages] standard extraction failed; using compatibility fallback', details);
      try {
        const messages = await client.pupPage.evaluate(async ({ chatId: requestedChatId, limit: requestedLimit }) => {
          const collection = window.require('WAWebCollections').Chat;
          const chat = collection.get(requestedChatId) || collection.getModelsArray().find((item) => item.id?._serialized === requestedChatId);
          if (!chat) return [];
          const models = chat.msgs?.getModelsArray?.() || [];
          return models.slice(-requestedLimit).map((message) => {
            const value = message.serialize();
            return {
              id: value.id?._serialized || value.id?.id || `${requestedChatId}:${value.t || Date.now()}`,
              chatId: requestedChatId,
              body: value.body || '[Media message]',
              fromMe: Boolean(value.id?.fromMe || value.fromMe),
              timestamp: (value.t || Date.now() / 1000) * 1000,
              ack: value.ack || 0,
              hasMedia: Boolean(value.isMedia || value.hasMedia),
              type: value.type || 'chat',
            };
          });
        }, { chatId, limit });
        ack?.({ ok: true, messages });
      } catch (fallbackError) {
        const fallbackDetails = errorDetails(fallbackError);
        console.error('[wa:getMessages]', fallbackDetails);
        ack?.({ ok: false, error: 'Unable to load WhatsApp messages.', details: fallbackDetails });
      }
    }
  });
  socket.on('wa:send', async ({ chatId, text } = {}, ack) => {
    try { ack?.({ ok: true, message: formatMessage(await client.sendMessage(chatId, text)) }); }
    catch (error) { const details = errorDetails(error); console.error('[wa:send]', details); ack?.({ ok: false, error: 'Unable to send WhatsApp message.', details }); }
  });
});
client.initialize().catch((error) => { const details = errorDetails(error); console.error('[initialize]', details); state.state = 'disconnected'; state.error = details.message; broadcast(); });
server.listen(port, () => console.log(`WhatsApp server listening on ${port}`));
