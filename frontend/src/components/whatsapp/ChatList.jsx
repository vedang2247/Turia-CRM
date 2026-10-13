'use client';
export function ChatList({ chats, selectedId, statuses, onSelect }) {
  return <div className="w-full divide-y divide-slate-100 border-r border-slate-200 bg-white md:w-80">{chats.map((chat) => <button type="button" key={chat.id} onClick={() => onSelect(chat.id)} className={`block w-full p-4 text-left hover:bg-slate-50 ${selectedId === chat.id ? 'bg-violet-50' : ''}`}><div className="flex justify-between gap-3"><strong className="truncate text-sm">{chat.name}</strong><span className="text-[11px] capitalize text-slate-400">{statuses[chat.id] || 'open'}</span></div><p className="mt-1 truncate text-xs text-slate-500">{chat.lastMessage?.body || 'No messages'}</p></button>)}</div>;
}
