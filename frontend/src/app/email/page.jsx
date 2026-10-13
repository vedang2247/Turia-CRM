'use client';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmailThread, fetchEmailThreads, fetchThreadLinks } from '../../store/emailSlice';
import { ThreadList } from '../../components/email/ThreadList';
import { ThreadView } from '../../components/email/ThreadView';
import { ComposeModal } from '../../components/email/ComposeModal';
import { ConvertEmailToTaskModal } from '../../components/tasks/ConvertEmailToTaskModal';
import { LinkToTaskModal } from '../../components/tasks/LinkToTaskModal';
export default function EmailPage() {
  const dispatch = useDispatch(); const { threads, selectedThreadId, selectedThread, loading, error, linkedByThread } = useSelector((state) => state.email); const [compose, setCompose] = useState(false); const [convert, setConvert] = useState(false); const [link, setLink] = useState(false);
  useEffect(() => { dispatch(fetchEmailThreads()); }, [dispatch]);
  useEffect(() => { if (selectedThreadId) dispatch(fetchThreadLinks(selectedThreadId)); }, [dispatch, selectedThreadId]);
  const messages = selectedThread?.messages || selectedThread || [];
  const thread = threads.find((item) => item.id === selectedThreadId);
  return <div className="min-h-[calc(100vh-90px)] rounded-xl border border-slate-200 bg-slate-50"><header className="flex items-center justify-between border-b border-slate-200 bg-white p-5"><div><h1 className="text-xl font-bold">Email inbox</h1><p className="text-xs text-slate-500">{loading ? 'Loading...' : `${threads.length} threads`}</p></div><button onClick={() => setCompose(true)} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Compose</button></header>{error && <p className="m-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<div className="flex min-h-[600px] flex-col md:flex-row"><aside className="w-full border-b border-slate-200 bg-white md:w-1/3 md:border-b-0 md:border-r"><ThreadList threads={threads} selectedId={selectedThreadId} linksByThread={linkedByThread} onSelect={(id) => dispatch(fetchEmailThread(id))} /></aside><main className="flex-1"><ThreadView messages={messages} links={linkedByThread[selectedThreadId] || []} onConvert={() => setConvert(true)} onLink={() => setLink(true)} /></main></div>{compose && <ComposeModal onClose={() => setCompose(false)} />}{convert && <ConvertEmailToTaskModal thread={thread} message={messages[0]} onClose={() => setConvert(false)} />}{link && <LinkToTaskModal thread={thread} message={messages[0]} onClose={() => setLink(false)} />}</div>;
}
