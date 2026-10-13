'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGmailProfile } from '../../store/connectionsSlice';
import { WhatsAppCard } from '../../components/connections/WhatsAppCard';
export default function ConnectionsPage() {
  const dispatch = useDispatch(); const { gmail } = useSelector((state) => state.connections);
  useEffect(() => { dispatch(fetchGmailProfile()); }, [dispatch]);
  return <div className="mx-auto max-w-5xl p-4 sm:p-8"><p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Workspace</p><h1 className="mt-1 text-2xl font-bold">Connections</h1><p className="mt-1 text-sm text-slate-500">Connect the communication channels used by your CRM.</p><div className="mt-8 grid gap-5 md:grid-cols-2"><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Gmail</h2><p className="mt-1 text-xs text-slate-500">{gmail.connected ? gmail.email : 'Not connected'}</p></div><span className={`h-3 w-3 rounded-full ${gmail.connected ? 'bg-emerald-500' : 'bg-slate-300'}`} /></div>{!gmail.connected && <a href="/api/auth/google" className="mt-5 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white">Connect Gmail</a>}{gmail.connected && <form action="/api/auth/logout" method="post" className="mt-5"><button className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Disconnect</button></form>}{gmail.error && <p className="mt-3 text-xs text-rose-600">{gmail.error}</p>}</section><WhatsAppCard /></div></div>;
}
