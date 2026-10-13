'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteTemplate, fetchTemplates } from '../../store/templatesSlice';
import { TemplateModal } from '../../components/TemplateModal';

export default function TemplatesPage() {
  const dispatch = useDispatch();
  const { items, loading, error, saving } = useSelector((state) => state.templates);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const visible = useMemo(() => items.filter((item) => `${item.name} ${item.subject} ${item.body}`.toLowerCase().includes(search.toLowerCase())), [items, search]);
  useEffect(() => { dispatch(fetchTemplates()); }, [dispatch]);
  async function remove(template) {
    if (window.confirm(`Delete "${template.name}"?`)) await dispatch(deleteTemplate(template.id));
  }
  return <div className="min-h-[calc(100vh-90px)] rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-8">
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-wider text-violet-600">CRM workspace</p><h1 className="text-2xl font-bold text-slate-900">Email templates</h1><p className="mt-1 text-sm text-slate-500">Create reusable messages for client communication.</p></div><button onClick={() => setEditing({})} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">New template</button></div>
    <div className="mb-5 flex items-center gap-3"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates" className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /><span className="text-xs text-slate-500">{items.length} total</span></div>
    {error && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {loading ? <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500">Loading templates...</div> : visible.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No templates found.</div> : <div className="grid gap-4 lg:grid-cols-2">{visible.map((template) => <article key={template.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">{template.name}</h2><p className="mt-1 text-sm text-slate-500">{template.subject}</p></div><span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-mono text-slate-500">#{template.id}</span></div><p className="mt-4 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-slate-600">{template.body}</p><div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3"><button onClick={() => setEditing(template)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">Edit</button><button disabled={saving} onClick={() => remove(template)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50">Delete</button></div></article>)}</div>}
    {editing && <TemplateModal template={editing.id ? editing : null} onClose={() => { setEditing(null); dispatch(fetchTemplates()); }} />}
  </div>;
}
