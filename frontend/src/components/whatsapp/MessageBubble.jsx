'use client';
export function MessageBubble({ message, onConvert }) { return <div className={`rounded-xl p-3 ${message.fromMe ? 'bg-violet-600 text-white' : 'bg-white text-slate-700'}`}><p>{message.body}</p><button type="button" onClick={() => onConvert(message)} className="mt-2 text-xs underline">Convert to task</button></div>; }
