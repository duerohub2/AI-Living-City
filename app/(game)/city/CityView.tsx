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
    <main className="city-shell">
      <header className="city-topbar">
        <div className="brand-lockup">
          <div className="brand-mark">V</div>
          <div><div className="brand-name">VIREO <span>CITY</span></div><div className="brand-subtitle">A living world</div></div>
        </div>
        <div className="resident-pill"><span className="online-dot" /> <span className="resident-label">WARGA</span><strong>{me.displayName}</strong></div>
        <div className="topbar-actions">
          <div className="wallet-pill"><span>◆</span><div><small>SALDO KAMU</small><strong>{Number(balance).toLocaleString('id-ID')} <em>COIN</em></strong></div></div>
          <button onClick={logout} className="exit-button">Keluar <span>↗</span></button>
        </div>
      </header>

      <section className="city-layout">
        <aside className="city-sidebar">
          <div className="eyebrow"><span className="online-dot" /> LIVE SIMULATION</div>
          <h1>Kota yang<br /><span>terus hidup.</span></h1>
          <p className="sidebar-copy">Jelajahi kota, temui warga, dan bangun kehidupanmu sendiri.</p>
          <div className="quick-stats">
            <div className="stat-card"><span className="stat-icon">⌖</span><div><small>LOKASI</small><strong>Central Plaza</strong></div></div>
            <div className="stat-card"><span className="stat-icon green">↗</span><div><small>AKTIVITAS</small><strong>Kota aktif</strong></div></div>
          </div>
          <div className="guide-card">
            <div className="guide-title"><span>✦</span> CARA BERMAIN</div>
            <div className="guide-step"><span>01</span><p><strong>Sentuh peta</strong><small>Karakter bergerak ke titik tujuan.</small></p></div>
            <div className="guide-step"><span>02</span><p><strong>Geser layar</strong><small>Jelajahi area kota yang lebih luas.</small></p></div>
            <div className="guide-step"><span>03</span><p><strong>Kunjungi toko</strong><small>Masuk ke toko pusat untuk bekerja.</small></p></div>
          </div>
          <div className="sidebar-footer"><span className="online-dot" /> DUNIA TERHUBUNG <span className="version-tag">BETA</span></div>
        </aside>

        <section className="game-panel">
          <div className="game-panel-head"><div><span className="panel-kicker">YOUR NEIGHBORHOOD</span><h2>Central District</h2></div><div className="map-live"><span className="online-dot" /> LIVE</div></div>
          <div className="game-stage">
            <div className="game-frame"><CityScene onEnterBuilding={() => setInBuilding(true)} /></div>
            <div className="map-hint"><span>✥</span> Sentuh untuk bergerak <i /> Geser untuk menjelajah</div>
          </div>
        </section>
      </section>

      {inBuilding && (
        <div className="city-modal-backdrop" onClick={() => setInBuilding(false)}>
          <section className="city-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-art"><span>▦</span><div>VIREO MARKET</div></div>
            <div className="modal-body"><div className="modal-kicker">CENTRAL DISTRICT</div><h2>Toko Pusat</h2><p>Ambil giliran kerja dan dapatkan koin untuk membangun kehidupanmu di kota.</p>
              <div className="wage-row"><span>Upah per giliran</span><strong>+15 COIN</strong></div>
              <button onClick={work} disabled={busy} className="work-button">{busy ? 'MEMPROSES...' : 'Mulai bekerja'} <span>→</span></button>
              <button onClick={() => setInBuilding(false)} className="close-button">Kembali ke kota</button>
            </div>
          </section>
        </div>
      )}
      {toast && <div className="city-toast"><span>✓</span>{toast}</div>}
    </main>
  );
}
