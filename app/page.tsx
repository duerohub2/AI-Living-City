'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function Home() {
  const [email, setEmail] = useState(''); const [username, setUsername] = useState('');
  const [platform, setPlatform] = useState('instagram'); const [status, setStatus] = useState('idle'); const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setStatus('loading');
    const res = await fetch('/api/v1/access-requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, platform }),
    });
    const json = await res.json();
    if (json.error) { setStatus('error'); setMsg(json.error.message); } 
    else { setStatus('success'); setMsg('Pendaftaran berhasil! Tunggu konfirmasi Admin.'); }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-white mb-2">AI Living City</h1>
      <p className="text-slate-400 mb-6 max-w-sm">Dunia eksklusif. Ikuti sosial media kami, lalu daftarkan dirimu untuk mendapatkan akses masuk kota.</p>
      <form onSubmit={submit} className="bg-panel p-6 rounded-2xl border border-white/10 space-y-4 text-left w-full max-w-sm">
        <h2 className="font-bold text-lg">Formulir Akses</h2>
        <div><label className="text-xs text-slate-400 block mb-1">Email</label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Platform</label>
          <select className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10" value={platform} onChange={e => setPlatform(e.target.value)}>
            <option value="instagram">Instagram</option><option value="tiktok">TikTok</option><option value="youtube">YouTube</option>
          </select>
        </div>
        <div><label className="text-xs text-slate-400 block mb-1">Username</label><Input required value={username} onChange={e => setUsername(e.target.value)} /></div>
        <Button disabled={status === 'loading' || status === 'success'} className="w-full">
          {status === 'loading' ? 'Mengirim...' : 'Daftar Akses'}
        </Button>
        {msg && <p className={`text-sm text-center ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>{msg}</p>}
      </form>
    </main>
  );
}
