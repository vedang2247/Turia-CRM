'use client';

import { useDispatch, useSelector } from 'react-redux';
import { setPage } from '../../store/tasksSlice';

export function TaskPagination() {
  const dispatch = useDispatch();
  const { total, page, limit, loading } = useSelector((state) => state.tasks);
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
      <span>Page {page} of {pages}</span>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1 || loading} onClick={() => dispatch(setPage(page - 1))} className="rounded border border-slate-200 px-3 py-1.5 disabled:opacity-40">Previous</button>
        <button type="button" disabled={page >= pages || loading} onClick={() => dispatch(setPage(page + 1))} className="rounded border border-slate-200 px-3 py-1.5 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
