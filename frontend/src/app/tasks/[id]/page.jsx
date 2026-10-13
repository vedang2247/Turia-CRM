'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTask } from '../../../store/tasksSlice';
import { fetchTemplates } from '../../../store/templatesSlice';
import { TaskEmailModal } from '../../../components/tasks/TaskEmailModal';
import { TaskInfo } from '../../../components/tasks/TaskInfo';
import { LinkedCommsTimeline } from '../../../components/tasks/LinkedCommsTimeline';

export default function TaskDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selectedTask, detailLoading, detailError } = useSelector((state) => state.tasks); const [email, setEmail] = useState(false);
  useEffect(() => { if (id) dispatch(fetchTask(id)); dispatch(fetchTemplates()); }, [dispatch, id]);
  if (detailLoading && !selectedTask) return <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500">Loading task...</div>;
  if (detailError || !selectedTask) return <div className="rounded-xl bg-white p-10 text-center"><p className="text-sm text-rose-600">{detailError || 'Task not found.'}</p><Link href="/tasks" className="mt-4 inline-block text-sm font-semibold text-violet-700">Back to tasks</Link></div>;
  return <div className="min-h-[calc(100vh-90px)] overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 text-sm"><div><Link href="/tasks" className="text-slate-500 hover:text-violet-700">Tasks</Link><span className="mx-2 text-slate-300">/</span><span className="font-mono font-semibold">{selectedTask.code}</span></div><button type="button" onClick={() => setEmail(true)} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white">Email client</button></div><div className="flex min-h-[calc(100vh-150px)] flex-col md:flex-row"><div className="w-full md:w-1/2"><TaskInfo task={selectedTask} /></div><div className="w-full md:w-1/2"><LinkedCommsTimeline links={selectedTask.links} sentEmails={selectedTask.sentEmails} /></div></div>{email && <TaskEmailModal task={selectedTask} onClose={() => setEmail(false)} />}</div>;
}
