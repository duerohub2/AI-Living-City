'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [status, setStatus] = useState('idle');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus('error');
      setMsg(error.message);
    } else {
      router.push('/city');
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-ink text-slate-200">
      <form onSubmit={handleLogin} className="bg-panel p-6 rounded-2xl border border-white/10 space-y-4 max-w-sm w-full">
        <h1 className="text-2xl font-bold text-white text-center mb-2">Login Vireo City</h1>
        <p className="text-xs text-slate-400 text-center mb-4">Masuk pakai email dan password akunmu.</p>
        
        <div>
          <label className="text-xs text-slate-400 block mb-1">Email</label>
          <Input type="email" placeholder="Email kamu" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        
        <div>
          <label className="text-xs text-slate-400 block mb-1">Password</label>
          <Input type="password" placeholder="Password kamu" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <Button disabled={status === 'loading'} className="w-full">
          {status === 'loading' ? 'Memeriksa...' : 'Masuk'}
        </Button>
        
        {msg && <p className="text-sm text-center text-red-400">{msg}</p>}
      </form>
    </main>
  );
}
