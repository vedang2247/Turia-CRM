'use client';

import { Composer } from './Composer';
import { TaskCodeBadge } from '../TaskCodeBadge';
export function ChatThread({ chat, messages, links = [], status, onStatus, onSend, onConvert }) {
  if (!chat) return <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Select a chat to view messages.</div>;
  return <section className="flex min-h-[500px] flex-1 flex-col bg-slate-50"><header className="flex items-center justify-between border-b border-slate-200 bg-white p-4"><div><h2 className="font-semibold">{chat.name}</h2><p className="text-xs text-slate-500">{chat.id}</p></div><button type="button" onClick={() => onStatus(status === 'resolved' ? 'open' : 'resolved')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold">{status === 'resolved' ? 'Reopen' : 'Resolve'}</button></header><div className="flex-1 space-y-3 overflow-y-auto p-4"><div className="flex gap-1">{links.map((link) => <TaskCodeBadge key={link.taskId} taskId={link.taskId} code={link.taskCode} />)}</div>{messages.map((message) => <div key={message.id} className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${message.fromMe ? 'bg-violet-600 text-white' : 'bg-white text-slate-700 shadow-sm'}`}><p>{message.body}</p><button type="button" onClick={() => onConvert(message)} className="mt-2 text-[11px] font-semibold underline opacity-80">Convert to task</button></div></div>)}</div><Composer onSend={onSend} disabled={status === 'resolved'} /></section>;
}
