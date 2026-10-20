import { requireUser } from '@/lib/api/request';
import { createServiceSupabase } from '@/lib/supabase/server';
import { ok, fail } from '@/lib/api/response';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { user, supabase } = await requireUser();
  if (!user) return fail('UNAUTHENTICATED', 'Belum masuk.', 401);

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return fail('FORBIDDEN', 'Hanya admin.', 403);

  const serviceSupabase = createServiceSupabase();
  
  const { data: request, error: reqError } = await serviceSupabase
    .from('access_requests')
    .select('*')
    .eq('id', params.id)
    .eq('status', 'pending')
    .single();

  if (reqError || !request) return fail('NOT_FOUND', 'Pendaftar tidak ditemukan.', 404);

  // Password default untuk semua pemain baru
  const defaultPassword = 'VireoCity2026!';

  try {
    // Buat akun langsung tanpa kirim email
    const { error: authError } = await serviceSupabase.auth.admin.createUser({
      email: request.email,
      password: defaultPassword,
      email_confirm: true, 
      user_metadata: { display_name: request.social_username }
    });

    if (authError && !authError.message.includes('already registered')) {
      throw authError;
    }

    await serviceSupabase.from('access_requests').update({ 
      status: 'approved', 
      reviewed_at: new Date().toISOString(), 
      reviewed_by: user.id 
    }).eq('id', params.id);

    return ok({ 
      message: `Akun ${request.email} berhasil dibuat! Beritahu password: ${defaultPassword}` 
    });
  } catch (err: any) { 
    return fail('APPROVE_FAILED', err.message || 'Gagal.', 500); 
  }
}
