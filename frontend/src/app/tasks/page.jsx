'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks } from '../../store/tasksSlice';
import { TaskFilters } from '../../components/tasks/TaskFilters';
import { TaskCard } from '../../components/tasks/TaskCard';
import { TaskPagination } from '../../components/tasks/TaskPagination';
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal';

export default function TasksPage() {
  const dispatch = useDispatch();
  const { items, loading, error, filters, page } = useSelector((state) => state.tasks);
  const [createOpen, setCreateOpen] = useState(false);
  useEffect(() => { dispatch(fetchTasks()); }, [dispatch, filters, page]);
  return <div className="min-h-[calc(100vh-90px)] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
    <div className="flex flex-col lg:flex-row">
      <TaskFilters onCreate={() => setCreateOpen(true)} />
      <main className="min-w-0 flex-1 p-4 sm:p-6">
        <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-wider text-violet-600">CRM workspace</p><h1 className="text-2xl font-bold text-slate-900">Task dashboard</h1><p className="mt-1 text-sm text-slate-500">Track client work from creation through resolution.</p></div>
        {error && <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        {loading && items.length === 0 ? <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500">Loading tasks...</div> : items.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="font-semibold text-slate-800">No tasks found</h2><p className="mt-1 text-sm text-slate-500">Try changing the filters or create your first task.</p><button onClick={() => setCreateOpen(true)} className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Create task</button></div> : <><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((task) => <TaskCard key={task.id} task={task} />)}</div><TaskPagination /></>}
      </main>
    </div>
    {createOpen && <CreateTaskModal onClose={() => { setCreateOpen(false); dispatch(fetchTasks()); }} />}
  </div>;
}
