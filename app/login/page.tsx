'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [status, setStatus] = useState('idle');
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    // Ini fungsi pamungkas buat ngirim Magic Link yang bener
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    
    if (error) {
      setStatus('error');
      setMsg(error.message);
    } else {
      setStatus('success');
      setMsg('Cek email kamu! Link login sudah dikirim oleh Vireo City.');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="bg-panel p-6 rounded-2xl border border-white/10 space-y-4 max-w-sm w-full">
        <h1 className="text-2xl font-bold text-white text-center mb-2">Login Vireo City</h1>
        <p className="text-xs text-slate-400 text-center mb-4">Masukkan email yang sudah di-approve oleh Admin.</p>
        <Input type="email" placeholder="Email kamu" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button disabled={status === 'loading' || status === 'success'} className="w-full">
          {status === 'loading' ? 'Mengirim...' : 'Kirim Link Login'}
        </Button>
        {msg && <p className={`text-sm text-center ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>{msg}</p>}
      </form>
    </main>
  );
}
