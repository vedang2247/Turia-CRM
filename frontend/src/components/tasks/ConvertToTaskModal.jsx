'use client';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createClient, matchClient } from '../../services/crmApi';
import { addLink, createTask } from '../../store/tasksSlice';

export function ConvertToTaskModal({ message, onClose }) {
  const dispatch = useDispatch(); const { saving } = useSelector((state) => state.tasks);
  const [client, setClient] = useState(null); const [form, setForm] = useState({ title: message.body?.slice(0, 80) || 'Follow up on WhatsApp message', description: message.body || '', clientId: '' }); const [error, setError] = useState('');
  useEffect(() => { matchClient({ phone: message.chatId?.replace(/@(c|g)\.us$/, '') }).then(setClient).catch(() => {}); }, [message.chatId]);
  async function submit(event) { event.preventDefault(); setError(''); let clientId = form.clientId ? Number(form.clientId) : client?.id || null; const taskResult = await dispatch(createTask({ title: form.title, description: form.description, clientId })); if (!createTask.fulfilled.match(taskResult)) { setError(taskResult.payload || 'Unable to create task.'); return; } const task = taskResult.payload; const linkResult = await dispatch(addLink({ taskId: task.id, type: 'whatsapp', chatId: message.chatId, messageId: message.id, snapshot: message.body })); if (!addLink.fulfilled.match(linkResult)) { setError(linkResult.payload || 'Task created, but the WhatsApp link could not be saved.'); return; } onClose(); }
  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4"><form onSubmit={submit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><h2 className="text-lg font-semibold">Convert message to task</h2>{client && <p className="mt-2 rounded bg-emerald-50 p-2 text-xs text-emerald-700">Matched client: {client.name}</p>}{error && <p className="mt-3 rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>}<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-4 w-full rounded-lg border px-3 py-2 text-sm" /><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="5" className="mt-3 w-full rounded-lg border px-3 py-2 text-sm" /><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button><button disabled={saving} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Create task</button></div></form></div>;
}
