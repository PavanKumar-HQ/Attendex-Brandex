import { createBrowserClient } from '@supabase/ssr';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ecuklegnixpfppaowhmf.supabase.co';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_vxlOwJKyk9pXp2LOyoehrg_90z1mDzF';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Global Supabase Client
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
);
