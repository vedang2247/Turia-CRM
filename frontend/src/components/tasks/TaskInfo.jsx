'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTask } from '../../store/tasksSlice';

export function TaskInfo({ task }) {
  const dispatch = useDispatch();
  const { teamMembers, clients, saving } = useSelector((state) => state.tasks);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(task);
  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  async function save(event) {
    event.preventDefault();
    const result = await dispatch(updateTask({ id: task.id, title: form.title, description: form.description, status: form.status, priority: form.priority, dueDate: form.dueDate || null, clientId: form.clientId || null, assigneeId: form.assigneeId || null, reviewerId: form.reviewerId || null }));
    if (updateTask.fulfilled.match(result)) setEditing(false);
  }
  if (!editing) return (
    <section className="h-full overflow-y-auto bg-white p-5 sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4"><div><span className="font-mono text-xs text-violet-700">{task.code}</span><h1 className="mt-2 text-2xl font-bold text-slate-900">{task.title}</h1></div><button onClick={() => setEditing(true)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Edit</button></div>
      <div className="grid gap-4 sm:grid-cols-2"><Info label="Status" value={task.status.replace('_', ' ')} /><Info label="Priority" value={task.priority} /><Info label="Client" value={task.client?.name || 'Unassigned'} /><Info label="Assignee" value={task.assignee?.name || 'Unassigned'} /><Info label="Due date" value={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'} /></div>
      <div className="mt-8"><h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Description</h2><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{task.description || 'No description provided.'}</p></div>
    </section>
  );
  return (
    <form onSubmit={save} className="h-full overflow-y-auto bg-white p-5 sm:p-8">
      <div className="mb-6 flex items-center justify-between"><h1 className="text-xl font-bold">Edit {task.code}</h1><button type="button" onClick={() => setEditing(false)} className="text-sm text-slate-500">Cancel</button></div>
      <label className="mb-4 block text-sm font-medium">Title<input required value={form.title} onChange={(e) => update('title', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
      <label className="mb-4 block text-sm font-medium">Description<textarea value={form.description || ''} onChange={(e) => update('description', e.target.value)} rows="5" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Status" value={form.status} onChange={(v) => update('status', v)} options={['open', 'in_progress', 'waiting', 'resolved', 'closed']} />
        <Select label="Priority" value={form.priority} onChange={(v) => update('priority', v)} options={['low', 'medium', 'high', 'urgent']} />
        <Select label="Client" value={form.clientId || ''} onChange={(v) => update('clientId', v ? Number(v) : null)} options={clients.map((x) => x.id)} labels={clients.map((x) => x.name)} empty="Unassigned" />
        <Select label="Assignee" value={form.assigneeId || ''} onChange={(v) => update('assigneeId', v ? Number(v) : null)} options={teamMembers.map((x) => x.id)} labels={teamMembers.map((x) => x.name)} empty="Unassigned" />
      </div>
      <label className="mt-4 block text-sm font-medium">Due date<input type="date" value={form.dueDate || ''} onChange={(e) => update('dueDate', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
      <button disabled={saving} className="mt-6 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">{saving ? 'Saving...' : 'Save changes'}</button>
    </form>
  );
}

function Info({ label, value }) { return <div className="rounded-lg border border-slate-100 bg-slate-50 p-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-sm font-medium capitalize text-slate-800">{value}</p></div>; }
function Select({ label, value, onChange, options, labels = options, empty }) { return <label className="text-sm font-medium">{label}<select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">{empty && <option value="">{empty}</option>}{options.map((x, i) => <option key={x} value={x}>{labels[i] || x}</option>)}</select></label>; }
