'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendGmailEmail } from '../../services/crmApi';
import { recordEmail } from '../../store/tasksSlice';

function render(value, task) {
  return value.replace(/\{\{client\.name\}\}/g, task.client?.name || '').replace(/\{\{task\.code\}\}/g, task.code).replace(/\{\{task\.title\}\}/g, task.title).replace(/\{\{task\.dueDate\}\}/g, task.dueDate || 'TBD');
}

export function TaskEmailModal({ task, onClose }) {
  const dispatch = useDispatch();
  const templates = useSelector((state) => state.templates.items);
  const [templateId, setTemplateId] = useState('');
  const [form, setForm] = useState({ to: task.client?.email || '', subject: `[${task.code}] `, body: '' });
  const [error, setError] = useState('');
  function choose(id) { const item = templates.find((item) => String(item.id) === String(id)); setTemplateId(id); if (item) setForm({ to: task.client?.email || '', subject: `[${task.code}] ${render(item.subject, task)}`, body: render(item.body, task) }); }
  async function submit(event) { event.preventDefault(); setError(''); try { const sent = await sendGmailEmail(form); const result = await dispatch(recordEmail({ taskId: task.id, toAddress: form.to, subject: form.subject, bodyText: form.body, gmailMsgId: sent.id, threadId: sent.threadId })); if (!recordEmail.fulfilled.match(result)) throw new Error(result.payload || 'Email sent but could not be recorded.'); onClose(); } catch (err) { setError(err.message); } }
  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4"><form onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"><h2 className="text-lg font-semibold">Email client</h2>{error && <p className="mt-3 rounded bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<select value={templateId} onChange={(e) => choose(e.target.value)} className="mt-5 w-full rounded-lg border px-3 py-2 text-sm"><option value="">Choose a template</option>{templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input required type="email" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} placeholder="Recipient" className="mt-3 w-full rounded-lg border px-3 py-2 text-sm" /><input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="mt-3 w-full rounded-lg border px-3 py-2 text-sm" /><textarea required rows="10" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Message" className="mt-3 w-full rounded-lg border px-3 py-2 font-mono text-sm" /><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button><button className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Send email</button></div></form></div>;
}
