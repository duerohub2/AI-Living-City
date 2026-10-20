'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

const CityScene = dynamic(() => import('@/components/game/CityScene'), { ssr: false });

export function CityView({ me, districts, locations, residents, balance }: any) {
  const router = useRouter();
  const [current, setCurrent] = useState(me.locationId);
  const [busy, setBusy] = useState(false);
  const [activeInterior, setActiveInterior] = useState<string | null>(null);

  async function moveTo(locationId: string, slug: string) {
    setBusy(true);
    await fetch('/api/v1/movement/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locationId }) });
    setBusy(false); setCurrent(locationId);
    if (slug.includes('store')) setActiveInterior('store');
    if (slug.includes('cafe')) setActiveInterior('cafe');
  }

  async function logout() {
    const supabase = createClient(); await supabase.auth.signOut(); router.push('/');
  }

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-ink">
      <header className="absolute top-0 left-0 right-0 z-20 flex justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex gap-4 bg-panel/90 px-4 py-2 rounded-full border border-white/10 text-sm">
          <span className="font-bold text-accent">AI City</span><span>{me.displayName}</span>
          <span className="text-yellow-400 font-bold">🪙 {balance}</span>
        </div>
        <Button onClick={logout} className="text-xs">Keluar</Button>
      </header>

      <div className="flex-1 relative"><CityScene locations={locations} residents={residents} currentLocationId={current} /></div>

      <aside className="absolute top-20 left-4 bottom-20 w-56 bg-panel/90 backdrop-blur border border-white/10 rounded-xl overflow-y-auto z-20 p-2">
        {districts.map((d: any) => (
          <details key={d.id} className="mb-2">
            <summary className="text-sm font-semibold cursor-pointer">{d.name}</summary>
            {locations.filter((l: any) => l.district_id === d.id).map((l: any) => (
              <button key={l.id} disabled={busy} onClick={() => moveTo(l.id, l.slug)} className={`block w-full text-left text-xs p-2 rounded mt-1 ${current === l.id ? 'bg-accent' : 'hover:bg-white/10'}`}>
                {l.name}
              </button>
            ))}
          </details>
        ))}
      </aside>

      {activeInterior && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full">
            <button onClick={() => setActiveInterior(null)} className="absolute -top-12 right-0 bg-red-500 text-white px-4 py-2 rounded-lg">Tutup [X]</button>
            <img src={`/assets/interiors/${activeInterior}.png`} alt="Interior" className="w-full rounded-2xl border-4 border-panel" onError={(e) => { e.currentTarget.src='https://placehold.co/800x450/1a1a2e/FFF?text=Gambar+Interior+Belum+Diupload'; }} />
          </div>
        </div>
      )}
    </div>
  );
}
