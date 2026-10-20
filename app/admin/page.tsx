import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminRequestList } from './AdminRequestList';

export default async function AdminPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) redirect('/city');
  const { data: requests } = await supabase.from('access_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false });
  return (<main className="p-8 max-w-4xl mx-auto min-h-screen"><h1 className="text-3xl font-bold mb-6 text-white">Admin: Pendaftar Baru</h1><AdminRequestList initialRequests={requests || []} /></main>);
}
