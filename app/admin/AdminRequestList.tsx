'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function AdminRequestList({ initialRequests }: { initialRequests: any[] }) {
  const [requests, setRequests] = useState(initialRequests); const [busyId, setBusyId] = useState<string | null>(null);
  async function approve(id: string) {
    if (!confirm('Setujui pendaftar ini?')) return;
    setBusyId(id);
    const res = await fetch(`/api/v1/admin/access-requests/${id}/approve`, { method: 'POST' });
    const json = await res.json(); setBusyId(null);
    if (json.error) alert(json.error.message);
    else { alert(json.data.message); setRequests(requests.filter(r => r.id !== id)); }
  }
  if (requests.length === 0) return <p className="text-slate-400">Tidak ada pendaftar baru.</p>;
  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div key={req.id} className="bg-panel border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-white">{req.social_username}</p>
            <p className="text-sm text-slate-400">{req.social_platform} • {req.email}</p>
          </div>
          <Button onClick={() => approve(req.id)} disabled={busyId === req.id}>
            {busyId === req.id ? 'Memproses...' : 'Approve & Kirim Link'}
          </Button>
        </div>
      ))}
    </div>
  );
}
