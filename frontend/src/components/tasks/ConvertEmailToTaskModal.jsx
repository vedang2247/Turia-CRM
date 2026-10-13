'use client';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { createClient, matchClient } from '../../services/crmApi';
import { addLink, createTask } from '../../store/tasksSlice';

function emailAddress(value = '') {
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim().toLowerCase();
}

export function ConvertEmailToTaskModal({ thread, message, onClose }) {
  const dispatch = useDispatch();
  const sender = emailAddress(message?.from || thread?.from);
  const [client, setClient] = useState(null);
  const [form, setForm] = useState({ title: message?.subject || thread?.subject || 'Follow up on email', description: message?.bodyText || message?.snippet || thread?.snippet || '' });
  const [newClient, setNewClient] = useState({ name: '', company: '' });
  const [error, setError] = useState('');

  useEffect(() => { if (sender) matchClient({ email: sender }).then(setClient).catch(() => {}); }, [sender]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    let clientId = client?.id || null;
    if (!clientId && newClient.name.trim()) {
      const created = await createClient({ name: newClient.name, email: sender, company: newClient.company });
      clientId = created.id;
    }
    const taskResult = await dispatch(createTask({ title: form.title, description: form.description, clientId }));
    if (!createTask.fulfilled.match(taskResult)) { setError(taskResult.payload || 'Unable to create task.'); return; }
    const linkResult = await dispatch(addLink({ taskId: taskResult.payload.id, type: 'email', threadId: message?.threadId || thread?.id, subject: message?.subject || thread?.subject, sender, note: 'Converted from email' }));
    if (!addLink.fulfilled.match(linkResult)) { setError(linkResult.payload || 'Task created, but the email link could not be saved.'); return; }
    onClose();
  }

  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4"><form onSubmit={submit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><h2 className="text-lg font-semibold">Convert email to task</h2><p className="mt-1 text-xs text-slate-500">From {sender || 'unknown sender'}</p>{client && <p className="mt-3 rounded bg-emerald-50 p-2 text-xs text-emerald-700">Matched client: {client.name}</p>}{error && <p className="mt-3 rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p>}<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-4 w-full rounded-lg border px-3 py-2 text-sm" /><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="5" className="mt-3 w-full rounded-lg border px-3 py-2 text-sm" />{!client && <><input value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} placeholder="New client name (optional)" className="mt-3 w-full rounded-lg border px-3 py-2 text-sm" /><input value={newClient.company} onChange={(e) => setNewClient({ ...newClient, company: e.target.value })} placeholder="Company (optional)" className="mt-3 w-full rounded-lg border px-3 py-2 text-sm" /></>}<div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button><button className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Create task</button></div></form></div>;
}
