'use client';

import Link from 'next/link';

const statusStyles = {
  open: 'bg-slate-100 text-slate-700', in_progress: 'bg-blue-50 text-blue-700',
  waiting: 'bg-amber-50 text-amber-700', resolved: 'bg-emerald-50 text-emerald-700', closed: 'bg-zinc-100 text-zinc-600',
};

export function TaskCard({ task }) {
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && !['resolved', 'closed'].includes(task.status);
  return (
    <Link href={`/tasks/${task.id}`} className="group flex min-h-44 flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md">
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-semibold text-slate-500">{task.code}</span>
          <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusStyles[task.status] || statusStyles.open}`}>{task.status.replace('_', ' ')}</span>
        </div>
        <h3 className="line-clamp-2 font-semibold text-slate-900 group-hover:text-violet-700">{task.title}</h3>
        {task.description && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{task.description}</p>}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="truncate">{task.clientName || 'No client'}{task.assigneeName ? ` · ${task.assigneeName}` : ''}</span>
        <span className={overdue ? 'font-semibold text-rose-600' : ''}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
      </div>
    </Link>
  );
}
