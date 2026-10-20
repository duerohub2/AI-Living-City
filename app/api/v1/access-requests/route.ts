import { createServiceSupabase } from '@/lib/supabase/server';
import { ok, fail } from '@/lib/api/response';
import { z } from 'zod';

const RequestSchema = z.object({ platform: z.enum(['instagram', 'tiktok', 'youtube']), username: z.string().min(2).max(50), email: z.string().email() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) return fail('VALIDATION', 'Data tidak valid.', 400);
    const supabase = createServiceSupabase();
    const { data: existing } = await supabase.from('access_requests').select('status').eq('email', parsed.data.email).maybeSingle();
    if (existing) {
      if (existing.status === 'pending') return fail('PENDING', 'Pendaftaran kamu sedang ditinjau.', 400);
      if (existing.status === 'approved') return fail('APPROVED', 'Email ini sudah disetujui. Cek emailmu.', 400);
    }
    await supabase.from('access_requests').insert({ social_platform: parsed.data.platform, social_username: parsed.data.username, email: parsed.data.email });
    return ok({ message: 'Pendaftaran berhasil.' });
  } catch { return fail('SERVER_ERROR', 'Terjadi kesalahan.', 500); }
}
