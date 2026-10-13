export function LinkedCommsTimeline({ links = [], sentEmails = [] }) {
  const entries = [
    ...links.map((link) => ({ ...link, kind: link.type === 'whatsapp' ? 'WhatsApp' : 'Email', text: link.snapshot || link.subject || link.note })),
    ...sentEmails.map((email) => ({ ...email, kind: 'Sent email', text: email.bodyText, createdAt: email.sentAt })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return (
    <section className="h-full overflow-y-auto border-l border-slate-200 bg-slate-50 p-5 sm:p-8">
      <h2 className="text-lg font-bold text-slate-900">Linked communication</h2>
      <p className="mt-1 text-xs text-slate-500">Messages and emails associated with this task.</p>
      {entries.length === 0 ? <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No communication linked yet.</div> : <div className="mt-6 space-y-4">{entries.map((entry, index) => <article key={`${entry.id}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex justify-between gap-3"><span className="text-xs font-semibold text-violet-700">{entry.kind}</span><time className="text-[11px] text-slate-400">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ''}</time></div>{entry.subject && <h3 className="mt-2 text-sm font-semibold">{entry.subject}</h3>}<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{entry.text || 'No message preview.'}</p></article>)}</div>}
    </section>
  );
}
