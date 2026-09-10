import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Create a Supabase project and set these in .env.'
  );
}

// createClient throws synchronously on an empty URL, which would crash the whole
// app on load before a Supabase project is configured. Fall back to a syntactically
// valid placeholder so the app still renders (and can show a clear "not configured"
// state) - every real auth/db call will simply fail until real credentials are set.
export const supabase = createClient(
  supabaseUrl || 'https://not-configured.supabase.co',
  supabaseAnonKey || 'not-configured'
);
