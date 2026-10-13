'use client';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendEmail } from '../../store/emailSlice';
export function ComposeModal({ onClose }) {
  const dispatch = useDispatch(); const sending = useSelector((state) => state.email.sending); const [form, setForm] = useState({ to: '', subject: '', body: '' });
  async function submit(event) { event.preventDefault(); const result = await dispatch(sendEmail(form)); if (sendEmail.fulfilled.match(result)) onClose(); }
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4"><form onSubmit={submit} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><h2 className="text-lg font-semibold">Compose email</h2>{['to', 'subject'].map((key) => <input required key={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={key === 'to' ? 'Recipient email' : 'Subject'} className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />)}<textarea required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Message" rows="7" className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button><button disabled={sending} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Send</button></div></form></div>;
}
