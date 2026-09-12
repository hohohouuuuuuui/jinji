import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY is missing. ' +
      'Real-time matching and chat will not work until these are set (see app/.env.example).',
  );
}

// A syntactically valid placeholder so createClient doesn't throw when env vars
// are missing (e.g. before Supabase is set up) — calls will fail gracefully
// at request time instead of crashing the whole app at import time.
export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder-anon-key');
