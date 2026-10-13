'use client';
import { TaskCodeBadge } from '../TaskCodeBadge';

export function ThreadView({ messages = [], links = [], onConvert, onLink }) {
  if (!messages.length) return <div className="p-8 text-center text-sm text-slate-500">Select a thread to read it.</div>;
  return <div className="space-y-4 p-5"><div className="flex gap-2"><button type="button" onClick={() => onConvert?.(messages[0])} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white">Convert to task</button><button type="button" onClick={() => onLink?.(messages[0])} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Link to task</button>{links.map((link) => <TaskCodeBadge key={link.taskId} taskId={link.taskId} code={link.taskCode} />)}</div>{messages.map((message) => <article key={message.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex justify-between gap-3"><strong className="text-sm">{message.from}</strong><time className="text-xs text-slate-400">{message.date}</time></div><p className="mt-1 text-xs text-slate-500">To: {message.to}</p><h2 className="mt-4 font-semibold">{message.subject}</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.bodyText}</p></article>)}</div>;
}
