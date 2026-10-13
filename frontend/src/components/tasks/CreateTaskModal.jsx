'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTask } from '../../store/tasksSlice';

export function CreateTaskModal({ onClose }) {
  const dispatch = useDispatch();
  const { clients, teamMembers, saving, error } = useSelector((state) => state.tasks);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '', clientId: 'all', assigneeId: 'all' });
  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event) {
    event.preventDefault();
    const result = await dispatch(createTask({ ...form, clientId: form.clientId === 'all' ? null : Number(form.clientId), assigneeId: form.assigneeId === 'all' ? null : Number(form.assigneeId) }));
    if (createTask.fulfilled.match(result)) onClose();
  }
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">Create task</h2><button type="button" onClick={onClose} className="text-slate-400">✕</button></div>
        {error && <p className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <label className="mb-4 block text-sm font-medium">Title<input required value={form.title} onChange={(e) => update('title', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
        <label className="mb-4 block text-sm font-medium">Description<textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows="3" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Priority<select value={form.priority} onChange={(e) => update('priority', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"><option>low</option><option>medium</option><option>high</option><option>urgent</option></select></label>
          <label className="text-sm font-medium">Due date<input type="date" value={form.dueDate} onChange={(e) => update('dueDate', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
          <label className="text-sm font-medium">Client<select value={form.clientId} onChange={(e) => update('clientId', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"><option value="all">Unassigned</option>{clients.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label className="text-sm font-medium">Assignee<select value={form.assigneeId} onChange={(e) => update('assigneeId', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"><option value="all">Unassigned</option>{teamMembers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        </div>
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancel</button><button disabled={saving} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Creating...' : 'Create task'}</button></div>
      </form>
    </div>
  );
}
