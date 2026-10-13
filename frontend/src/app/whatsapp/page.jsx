'use client';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadChats, loadMessages, sendMessage, setSelectedChat, updateChatStatus } from '../../store/whatsappSlice';
import { ChatList } from '../../components/whatsapp/ChatList';
import { ChatThread } from '../../components/whatsapp/ChatThread';
import { ConvertToTaskModal } from '../../components/tasks/ConvertToTaskModal';
import { fetchLinksByChat } from '../../store/tasksSlice';
export default function WhatsAppPage() {
  const dispatch = useDispatch(); const { chats, selectedChatId, messages, chatStatuses, connection, error } = useSelector((state) => state.whatsapp); const { linkedByChat } = useSelector((state) => state.tasks); const [convert, setConvert] = useState(null);
  const chat = chats.find((item) => item.id === selectedChatId);
  useEffect(() => { if (connection.state === 'ready') dispatch(loadChats()); }, [dispatch, connection.state]);
  useEffect(() => { if (selectedChatId && connection.state === 'ready') { dispatch(loadMessages(selectedChatId)); dispatch(fetchLinksByChat(selectedChatId)); } }, [dispatch, selectedChatId, connection.state]);
  const visible = useMemo(() => chats.filter((item) => item.name?.toLowerCase().includes('')), [chats]);
  function select(id) { dispatch(setSelectedChat(id)); }
  return <div className="min-h-[calc(100vh-90px)] overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><header className="border-b border-slate-200 bg-white p-5"><h1 className="text-xl font-bold">WhatsApp inbox</h1><p className="text-xs text-slate-500">Live conversations and task conversion.</p></header>{connection.state !== 'ready' && <p className="m-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">WhatsApp is {connection.state}. Chats will load automatically after the phone is connected.</p>}{error && connection.state === 'ready' && <p className="m-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<div className="flex flex-col md:flex-row"><ChatList chats={visible} selectedId={selectedChatId} statuses={chatStatuses} onSelect={select} /><ChatThread chat={chat} links={linkedByChat[selectedChatId] || []} messages={messages[selectedChatId] || []} status={chatStatuses[selectedChatId] || 'open'} onStatus={(status) => dispatch(updateChatStatus({ chatId: selectedChatId, status }))} onSend={(text) => dispatch(sendMessage({ chatId: selectedChatId, text }))} onConvert={setConvert} /></div>{convert && <ConvertToTaskModal message={convert} onClose={() => setConvert(null)} />}</div>;
}
