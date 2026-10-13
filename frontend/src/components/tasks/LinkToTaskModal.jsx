'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addLink, findTasks } from '../../store/tasksSlice';

export function LinkToTaskModal({ thread, message, onClose }) {
  const dispatch = useDispatch();
  const { searchResults } = useSelector((state) => state.tasks);
  const [query, setQuery] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  async function search(event) { const value = event.target.value; setQuery(value); if (value.trim()) await dispatch(findTasks(value)); }
  async function link(taskId) {
    const result = await dispatch(addLink({ taskId, type: 'email', threadId: message?.threadId || thread?.id, subject: message?.subject || thread?.subject, sender: message?.from || thread?.from, note }));
    if (addLink.fulfilled.match(result)) onClose(); else setError(result.payload || 'Unable to link email.');
  }
  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4"><div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><div className="flex justify-between"><h2 className="text-lg font-semibold">Link email to task</h2><button onClick={onClose}>✕</button></div><input autoFocus value={query} onChange={search} placeholder="Search task title or code" className="mt-5 w-full rounded-lg border px-3 py-2 text-sm" /><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" className="mt-3 w-full rounded-lg border px-3 py-2 text-sm" />{error && <p className="mt-3 text-xs text-rose-600">{error}</p>}<div className="mt-4 max-h-60 space-y-2 overflow-y-auto">{searchResults.map((task) => <button type="button" key={task.id} onClick={() => link(task.id)} className="block w-full rounded-lg border p-3 text-left hover:bg-violet-50"><span className="font-mono text-xs text-violet-700">{task.code}</span><span className="ml-2 text-sm font-semibold">{task.title}</span></button>)}</div><button type="button" onClick={onClose} className="mt-5 rounded-lg border px-4 py-2 text-sm">Cancel</button></div></div>;
}
