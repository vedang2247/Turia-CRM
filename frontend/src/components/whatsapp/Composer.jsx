'use client';
import { useState } from 'react';
export function Composer({ onSend, disabled }) {
  const [text, setText] = useState('');
  function submit(event) { event.preventDefault(); if (!text.trim()) return; onSend(text.trim()); setText(''); }
  return <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 bg-white p-3"><input value={text} onChange={(e) => setText(e.target.value)} disabled={disabled} placeholder="Write a message" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" /><button disabled={disabled} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Send</button></form>;
}
