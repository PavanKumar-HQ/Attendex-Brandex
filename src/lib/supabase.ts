import { createBrowserClient } from '@supabase/ssr';

// Institutional production Supabase endpoint & anon key
const DEFAULT_SUPABASE_URL = 'https://ecuklegnixpfppaowhmf.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_vxlOwJKyk9pXp2LOyoehrg_90z1mDzF';

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseUrl = 
  envUrl && !envUrl.includes('your-project') && !envUrl.includes('example.com')
    ? envUrl
    : DEFAULT_SUPABASE_URL;

export const supabaseAnonKey = 
  envKey && !envKey.includes('your-publishable-anon-key') && envKey.length > 20
    ? envKey
    : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project')
);

// Global Supabase Client
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
);
