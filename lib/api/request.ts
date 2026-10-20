import { createServerSupabase } from '@/lib/supabase/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export async function requireUser(): Promise<{ user: User | null; supabase: SupabaseClient }> {
  const supabase = createServerSupabase();
  const { data } = await supabase.auth.getUser();
  return { user: data.user ?? null, supabase };
}
