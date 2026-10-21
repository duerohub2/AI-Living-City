'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const CityScene = dynamic(() => import('@/components/game/CityScene'), { ssr: false });

export function CityView({ me, balance: initialBalance }: any) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [inBuilding, setInBuilding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function logout() { await createClient().auth.signOut(); router.push('/'); }

  async function work() {
    setBusy(true);
    const res = await fetch('/api/v1/actions/work', { method: 'POST' });
    const json = await res.json();
    setBusy(false);
    if (json.error) setToast(json.error.message);
    else { setBalance((b: number) => b + json.data.wage); setToast(`+${json.data.wage} COIN!`); }
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-black select-none">
      <CityScene onEnterBuilding={() => setInBuilding(true)} />

      {/* HEADER UI */}
      <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none z-10">
        <div className="bg-slate-900/90 text-white px-4 py-2 rounded-xl border border-slate-600 flex gap-4 pointer-events-auto items-center shadow-xl">
          <span className="font-black text-purple-400">VIREO</span>
          <span className="text-sm font-bold">{me.displayName}</span>
          <div className="bg-black/50 px-2 py-1 rounded text-yellow-400 text-sm font-bold border border-yellow-500/30">{balance} COIN</div>
        </div>
        <button onClick={logout} className="pointer-events-auto bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">EXIT</button>
      </div>

      {/* MODAL KERJA */}
      {inBuilding && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-purple-500 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Toko Pusat</h2>
            <p className="text-xs text-slate-400 mb-6">Bekerja di sini untuk mendapatkan upah.</p>
            <button onClick={work} disabled={busy} className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-xl mb-3">
              {busy ? 'BEKERJA...' : 'KERJA (+15 COIN)'}
            </button>
            <button onClick={() => setInBuilding(false)} className="w-full py-2 bg-slate-700 text-white rounded-xl text-sm">TUTUP</button>
          </div>
        </div>
      )}

      {/* NOTIFIKASI */}
      {toast && <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded-full font-bold z-50 shadow-lg">{toast}</div>}
    </div>
  );
}
