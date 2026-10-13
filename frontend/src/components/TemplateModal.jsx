'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTemplate, updateTemplate } from '../store/templatesSlice';

const placeholders = ['{{client.name}}', '{{task.code}}', '{{task.title}}', '{{task.dueDate}}'];

export function TemplateModal({ template, onClose }) {
  const dispatch = useDispatch();
  const saving = useSelector((state) => state.templates.saving);
  const [form, setForm] = useState({ name: '', subject: '', body: '', ...template });
  const editing = Boolean(template);
  useEffect(() => setForm({ name: '', subject: '', body: '', ...template }), [template]);
  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event) {
    event.preventDefault();
    const action = editing ? updateTemplate({ id: template.id, name: form.name, subject: form.subject, body: form.body }) : createTemplate({ name: form.name, subject: form.subject, body: form.body });
    const result = await dispatch(action);
    if ((editing ? updateTemplate : createTemplate).fulfilled.match(result)) onClose();
  }
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold">{editing ? 'Edit template' : 'New email template'}</h2><p className="mt-1 text-xs text-slate-500">Use placeholders to personalize task emails later.</p></div><button type="button" onClick={onClose} className="text-slate-400">✕</button></div>
        <label className="mb-4 block text-sm font-medium">Template name<input required value={form.name} onChange={(e) => update('name', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
        <label className="mb-4 block text-sm font-medium">Subject<input required value={form.subject} onChange={(e) => update('subject', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
        <label className="block text-sm font-medium">Body<textarea required value={form.body} onChange={(e) => update('body', e.target.value)} rows="9" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm" /></label>
        <div className="mt-3 flex flex-wrap gap-2">{placeholders.map((placeholder) => <button type="button" key={placeholder} onClick={() => update('body', `${form.body}${form.body ? '\n' : ''}${placeholder}`)} className="rounded-full border border-violet-200 bg-violet-50 px-2 py-1 font-mono text-[11px] text-violet-700">{placeholder}</button>)}</div>
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancel</button><button disabled={saving} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Save changes' : 'Create template'}</button></div>
      </form>
    </div>
  );
}
