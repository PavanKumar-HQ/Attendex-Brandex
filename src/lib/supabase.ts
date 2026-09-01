import { createBrowserClient } from '@supabase/ssr';

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Fast-fail fetch wrapper to prevent infinite loading screens when Supabase is sleeping/paused
const customFetch = (url: string | URL | Request, options?: RequestInit) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 1500); // 1.5s timeout
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id))
    .catch(err => {
      // Return a simulated failing response so Supabase client throws gracefully
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
