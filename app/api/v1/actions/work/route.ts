import { requireUser } from '@/lib/api/request';
import { createServiceSupabase } from '@/lib/supabase/server';
import { ok, fail } from '@/lib/api/response';

const WORK_LOCATIONS = ['cafe', 'store', 'warehouse'];
const WAGE = 15;
const COOLDOWN_SECONDS = 10;

export async function POST() {
  const { user, supabase } = await requireUser();
  if (!user) return fail('UNAUTHENTICATED', 'Belum masuk.', 401);

  const { data: resident } = await supabase
    .from('residents')
    .select('id, current_location_id')
    .eq('owner_user_id', user.id)
    .eq('resident_type', 'human')
    .maybeSingle();

  if (!resident) return fail('NO_RESIDENT', 'Karakter tidak ditemukan.', 404);
  if (!resident.current_location_id) return fail('NO_LOCATION', 'Kamu belum di lokasi manapun.', 400);

  const { data: loc } = await supabase
    .from('locations')
    .select('location_type, name')
    .eq('id', resident.current_location_id)
    .single();

  if (!loc || !WORK_LOCATIONS.includes(loc.location_type)) {
    return fail('NOT_WORKPLACE', 'Lokasi ini bukan tempat kerja.', 400);
  }

  const admin = createServiceSupabase();
  const since = new Date(Date.now() - COOLDOWN_SECONDS * 1000).toISOString();
  const { data: recent } = await admin
    .from('ledger_transactions')
    .select('id')
    .eq('transaction_type', 'work_wage')
    .eq('actor_id', user.id)
    .gte('created_at', since)
    .limit(1);

  if (recent && recent.length > 0) {
    return fail('COOLDOWN', `Tunggu ${COOLDOWN_SECONDS} detik sebelum bekerja lagi.`, 429);
  }

  const [rw, tw] = await Promise.all([
    admin.from('wallets').select('id').eq('owner_type', 'resident').eq('owner_id', resident.id).maybeSingle(),
    admin.from('wallets').select('id').eq('owner_type', 'system').limit(1).maybeSingle(),
  ]);

  if (!rw.data || !tw.data) return fail('WALLET_ERROR', 'Dompet tidak ditemukan.', 500);

  const { data: txId, error: txErr } = await admin.rpc('post_ledger_transaction', {
    p_idempotency_key: `work-${resident.id}-${Date.now()}`,
    p_transaction_type: 'work_wage',
    p_actor_id: user.id,
    p_reference_type: 'location',
    p_reference_id: resident.current_location_id,
    p_entries: [
      { wallet_id: tw.data.id, direction: 'debit', amount: WAGE },
      { wallet_id: rw.data.id, direction: 'credit', amount: WAGE },
    ],
  });

  if (txErr) return fail('LEDGER_ERROR', txErr.message, 500);

  return ok({ txId, wage: WAGE, location: loc.name });
}
