import { createClient } from '@supabase/supabase-js'

// This is a dummy implementation for Supabase.
// For a real implementation, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file

// Use console.warn instead of error to avoid crashing the app
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials missing. Using fallback authentication.');
}

// Create a mock supabase client with no-op methods
const createMockClient = () => {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
      signUp: async () => ({ data: null, error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: null })
    }
  };
};

// Initialize real client if credentials exist, otherwise use mock
let supabaseClient;
try {
  // Only create client if both URL and key are present and valid
  if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
    supabaseClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    );
  } else {
    supabaseClient = createMockClient();
  }
} catch (error) {
  console.warn('Error initializing Supabase client:', error);
  supabaseClient = createMockClient();
}

export const supabase = supabaseClient;
