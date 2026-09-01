import { createBrowserClient } from '@supabase/ssr';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Production fetch wrapper with generous 10s timeout
const customFetch = (url: string | URL | Request, options?: RequestInit) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000); // 10s timeout
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id))
    .catch(err => {
      return new Response(JSON.stringify({ error: 'Network timeout' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' }
      });
    });
};

// Global Browser Client
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    global: {
      fetch: customFetch
    }
  }
);
