'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useSelector } from 'react-redux';

export function WhatsAppCard() {
  const wa = useSelector((state) => state.connections.whatsapp);
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-semibold">WhatsApp</h2><p className="mt-1 text-xs capitalize text-slate-500">{wa.state}</p></div><span className={`h-3 w-3 rounded-full ${wa.state === 'ready' ? 'bg-emerald-500' : 'bg-amber-400'}`} /></div>{wa.qrCode && <div className="mt-5 inline-block rounded-lg border border-slate-100 p-3"><QRCodeSVG value={wa.qrCode} size={180} /></div>}{wa.state === 'ready' && <p className="mt-4 text-sm text-emerald-700">Connected as {wa.clientInfo?.name || wa.clientInfo?.number}.</p>}{wa.error && <p className="mt-3 text-xs text-rose-600">{wa.error}</p>}</section>;
}
