import { createClient } from '@supabase/supabase-js'

// Check if Supabase credentials are available
const hasSupabaseCredentials = () => {
  return import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
}

// Initialize supabase client if credentials exist
export const supabase = hasSupabaseCredentials() 
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    )
  : null;
