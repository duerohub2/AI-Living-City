import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CityView } from './CityView';

export default async function CityPage() {
  const supabase = createServerSupabase();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect('/');
  const { data: resident } = await supabase.from('residents').select('id, display_name, current_location_id').eq('owner_user_id', userData.user.id).eq('resident_type', 'human').maybeSingle();
  
  // Jika belum punya karakter, kita arahkan ke pembuatan karakter (sementara kita bypass dulu di kode ini, nanti kita buat halamannya)
  if (!resident) {
    // Kita buatkan otomatis karakter default untuk testing blind deployment
    await supabase.rpc('create_human_resident', { p_display_name: 'Warga Baru' });
    redirect('/city');
  }

  const { data: districts } = await supabase.from('districts').select('id, slug, name').order('name');
  const { data: locations } = await supabase.from('locations').select('id, district_id, slug, name, coordinates');
  const { data: residents } = await supabase.from('residents').select('id, display_name, current_location_id').eq('resident_type', 'human');
  const { data: balances } = await supabase.rpc('get_my_wallet_balance');

  return (
    <CityView
      me={{ id: resident.id, displayName: resident.display_name, locationId: resident.current_location_id }}
      districts={districts ?? []} locations={locations ?? []} residents={residents ?? []} balance={balances?.[0]?.balance ?? 0}
    />
  );
}
