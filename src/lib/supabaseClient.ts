import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://gxfijmdsmvlrlcgdjfey.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_Unvft1oAQ2NJ9eGsVAYZYg_WBp-7O8s';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
