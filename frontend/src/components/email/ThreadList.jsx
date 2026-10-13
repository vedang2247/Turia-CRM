'use client';
import { TaskCodeBadge } from '../TaskCodeBadge';
export function ThreadList({ threads, selectedId, onSelect, linksByThread = {} }) {
  return <div className="divide-y divide-slate-100">{threads.map((thread) => <button type="button" key={thread.id} onClick={() => onSelect(thread.id)} className={`block w-full p-4 text-left hover:bg-slate-50 ${selectedId === thread.id ? 'bg-violet-50' : ''}`}><div className="flex justify-between gap-3"><strong className="truncate text-sm">{thread.subject}</strong><time className="shrink-0 text-[11px] text-slate-400">{thread.date ? new Date(thread.date).toLocaleDateString() : ''}</time></div><p className="mt-1 truncate text-xs text-slate-500">{thread.from}</p><p className="mt-1 truncate text-xs text-slate-400">{thread.snippet}</p><div className="mt-2 flex gap-1">{(linksByThread[thread.id] || []).map((link) => <TaskCodeBadge key={link.taskId} taskId={link.taskId} code={link.taskCode} />)}</div></button>)}</div>;
}
