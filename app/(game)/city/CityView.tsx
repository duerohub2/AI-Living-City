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

  async function logout() {
    await createClient().auth.signOut();
    router.push('/');
  }

  async function work() {
    setBusy(true);
    try {
      const res = await fetch('/api/v1/actions/work', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || json.error) setToast(json.error?.message ?? 'Gagal bekerja. Coba lagi.');
      else {
        setBalance((b: number) => b + json.data.wage);
        setToast(`+${json.data.wage} COIN • Upah diterima`);
      }
    } catch {
      setToast('Koneksi bermasalah. Coba lagi.');
    } finally {
      setBusy(false);
      window.setTimeout(() => setToast(null), 2800);
    }
  }

  return (
    <main className="coc-world">
      <div className="world-map"><CityScene onEnterBuilding={() => setInBuilding(true)} /></div>
      <div className="game-hud">
        <div className="player-badge">
          <div className="player-avatar">LV 1</div>
          <div className="player-meta"><strong>{me.displayName}</strong><span>WARGA KOTA</span></div>
        </div>
        <div className="resource-pill"><span className="coin-icon" aria-hidden="true" /><strong>{Number(balance).toLocaleString('id-ID')}</strong><small>COIN</small></div>
        <button onClick={logout} className="game-exit" aria-label="Keluar dari game" title="Keluar">KELUAR</button>
      </div>
      <div className="world-tip">SENTUH PETA UNTUK BERGERAK <i /> GESER UNTUK MENJELAJAH <button type="button" aria-label="Perbesar peta" onClick={() => window.dispatchEvent(new CustomEvent('city-map-zoom', { detail: 0.12 }))}>+</button><button type="button" aria-label="Perkecil peta" onClick={() => window.dispatchEvent(new CustomEvent('city-map-zoom', { detail: -0.12 }))}>−</button></div>

      {inBuilding && (
        <div className="city-modal-backdrop" onClick={() => setInBuilding(false)}>
          <section className="city-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-art"><div>VIREO MARKET</div></div>
            <div className="modal-body"><div className="modal-kicker">CENTRAL DISTRICT</div><h2>Toko Pusat</h2><p>Ambil giliran kerja dan dapatkan koin untuk membangun kehidupanmu di kota.</p>
              <div className="wage-row"><span>Upah per giliran</span><strong>+15 COIN</strong></div>
              <button onClick={work} disabled={busy} className="work-button">{busy ? 'MEMPROSES...' : 'Mulai bekerja'} <span>→</span></button>
              <button onClick={() => setInBuilding(false)} className="close-button">Kembali ke kota</button>
            </div>
          </section>
        </div>
      )}
      {toast && <div className="city-toast">{toast}</div>}
    </main>
  );
}
