'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function CityView({ me, districts, locations, residents, balance: initialBalance }: any) {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<'map' | 'residents' | 'activity'>('map');
  const [balance, setBalance] = useState(initialBalance);
  const [activity, setActivity] = useState<any[]>([]);
  const [currentLoc, setCurrentLoc] = useState<string | null>(me.locationId);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [modal, setModal] = useState<string | null>(null);

  const currentLocation = locations.find((l: any) => l.id === currentLoc);
  const canWork = currentLocation && ['cafe', 'store', 'warehouse'].includes(currentLocation.location_type);
  const residentsHere = residents.filter((r: any) => r.current_location_id === currentLoc);

  // Load log aktivitas
  useEffect(() => {
    supabase.from('ledger_transactions')
      .select('id, transaction_type, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setActivity(data); });
  }, [supabase]);

  // Efek Toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function travel(locId: string, slug: string, name: string) {
    setBusy(true);
    const res = await fetch('/api/v1/movement/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationId: locId }),
    });
    const json = await res.json();
    setBusy(false);
    if (json.error) return setToast({ type: 'err', text: json.error.message });
    
    setCurrentLoc(locId);
    setToast({ type: 'ok', text: `Tiba di ${name}` });
    
    if (slug.includes('cafe')) setModal('/assets/interiors/cafe.png');
    if (slug.includes('store')) setModal('/assets/interiors/store.png');
  }

  async function work() {
    setBusy(true);
    const res = await fetch('/api/v1/actions/work', { method: 'POST' });
    const json = await res.json();
    setBusy(false);
    if (json.error) return setToast({ type: 'err', text: json.error.message });
    
    setBalance((b: number) => b + json.data.wage);
    setToast({ type: 'ok', text: `+${json.data.wage} COIN dari ${json.data.location}` });
    setActivity((a: any[]) => [{ id: json.data.txId, transaction_type: 'work_wage', created_at: new Date().toISOString() }, ...a]);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  function timeAgo(s: string) {
    const d = Math.floor((Date.now() - new Date(s).getTime()) / 1000);
    if (d < 60) return 'baru saja';
    if (d < 3600) return `${Math.floor(d / 60)} mnt lalu`;
    return `${Math.floor(d / 3600)} jam lalu`;
  }

  return (
    <div className="h-screen w-full bg-[#0a0b14] text-slate-200 flex flex-col overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="h-14 bg-[#12141f] border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center font-black text-white text-sm">V</div>
          <div>
            <p className="font-black text-sm text-white tracking-wider leading-none">VIREO CITY</p>
            <p className="text-[10px] text-green-400 leading-none mt-1 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#1a1d2e] px-3 py-1.5 rounded-lg border border-yellow-500/20">
            <span className="text-yellow-400 text-sm">◉</span>
            <span className="font-black text-yellow-400 text-sm tabular-nums">{balance}</span>
            <span className="text-[10px] text-yellow-500/60 font-bold">COIN</span>
          </div>
          <button onClick={logout} className="text-xs font-bold text-slate-500 hover:text-red-400 px-2">EXIT</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-64 bg-[#12141f] border-r border-slate-800 flex flex-col shrink-0">
          <div className="flex border-b border-slate-800">
            {[{ id: 'map', label: 'PETA' }, { id: 'residents', label: 'WARGA' }, { id: 'activity', label: 'LOG' }].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                className={`flex-1 py-2.5 text-[10px] font-black tracking-wider ${tab === t.id ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/5' : 'text-slate-600'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {tab === 'map' && districts.map((d: any) => (
              <div key={d.id} className="mb-4">
                <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 px-1">{d.name}</h3>
                <div className="space-y-1">
                  {locations.filter((l: any) => l.district_id === d.id).map((l: any) => {
                    const isHere = currentLoc === l.id;
                    return (
                      <button key={l.id} disabled={busy} onClick.name={() => travel(l.id, l.slug, l)}
                        className={`w-full text-left px-2.5 py-2 rounded-md text-xs flex items-center justify-between ${isHere ? 'bg-purple-600/20 border border-purple-500/40 text-purple-200' : 'hover:bg-slate-800/60 text-slate-400 border border-transparent'}`}>
                        <span className="truncate">{l.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {tab === 'residents' && residents.map((r: any) => (
              <div key={r.id} className={`p-2 rounded-md border mb-1.5 ${r.id === me.id ? 'bg-purple-600/10 border-purple-500/30' : 'bg-slate-800/40 border-slate-700/50'}`}>
                <p className={`text-xs font-bold truncate ${r.id === me.id ? 'text-purple-300' : 'text-white'}`}>{r.display_name} {r.id === me.id && '(Kamu)'}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{r.resident_type === 'ai' ? 'AI Resident' : 'Human'}</p>
              </div>
            ))}

            {tab === 'activity' && (
              activity.length === 0 ? <p className="text-[10px] text-slate-600 italic">Belum ada log.</p> :
              activity.map((a: any) => (
                <div key={a.id} className="p-2 rounded-md bg-slate-800/40 border border-slate-700/50 mb-1.5">
                  <p className="text-xs text-slate-300">{a.transaction_type === 'work_wage' ? 'Menerima gaji' : 'Bonus awal'}</p>
                  <p className="text-[9px] text-slate-600 mt-1">{timeAgo(a.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 relative bg-gradient-to-br from-[#0f1220] via-[#0a0b14] to-[#12141f] overflow-hidden flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="bg-[#12141f]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <div className="mb-6 border-b border-slate-800 pb-4">
                <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-1">Posisi Saat Ini</p>
                <h1 className="text-2xl font-black text-white">{currentLocation?.name || 'Di Kota'}</h1>
                <p className="text-xs text-slate-500 mt-1">{currentLocation?.location_type?.toUpperCase() || '—'}</p>
              </div>

              <div className="space-y-2">
                {canWork && (
                  <button onClick={work} disabled={busy}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white font-black text-sm rounded-lg shadow-lg active:scale-[0.98]">
                    {busy ? 'BEKERJA...' : 'BEKERJA (+15 COIN)'}
                  </button>
                )}
                {currentLocation && ['cafe', 'store'].includes(currentLocation.location_type) && (
                  <button onClick={() => setModal(currentLocation.location_type === 'cafe' ? '/assets/interiors/cafe.png' : '/assets/interiors/store.png')}
                    className="w-full py-3 bg-[#1a1d2e] hover:bg-[#242838] border border-slate-700 text-white font-black text-sm rounded-lg">
                    MASUK INTERIOR
                  </button>
                )}
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-600 mt-4 italic">Aksi tersimpan ke server · Refresh aman</p>
          </div>

          {/* TOAST */}
          {toast && (
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-xs font-bold shadow-xl z-30 ${toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{toast.text}</div>
          )}
        </main>
      </div>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={modal} alt="Interior" className="w-full rounded-xl border-2 border-slate-700 bg-[#12141f]"
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x450/0f1220/5865f2?text=Upload+ke+public%2Fassets%2Finteriors%2F'; }} />
            <button onClick={() => setModal(null)} className="mt-4 mx-auto block bg-slate-700 hover:bg-slate-600 px-8 py-2 rounded-lg font-bold text-sm text-white">TUTUP</button>
          </div>
        </div>
      )}
    </div>
  );
}
