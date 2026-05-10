import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pofpmyiqjtwjesisytbd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZnBteWlzanR3amVzaXN0eWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwNjU3NjcsImV4cCI6MjA2MTY1MTc2N30.yVyXjG0J9U8QZ9xX6J5Z1K2N3H8P4F7E6D9C8B7A6X5Y4Z3W2V1U0T9S8R7Q6P5N4M3L2K1J0I";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('  - VITE_SUPABASE_URL is not set');
  if (!supabaseAnonKey) console.error('  - VITE_SUPABASE_ANON_KEY is not set');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: {
          getItem: (key) => {
            try {
              return localStorage.getItem(key);
            } catch {
              return null;
            }
          },
          setItem: (key, value) => {
            try {
              localStorage.setItem(key, value);
            } catch (e) {
              console.warn('localStorage not available:', e.message);
            }
          },
          removeItem: (key) => {
            try {
              localStorage.removeItem(key);
            } catch {
              // Ignore
            }
          },
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function isSupabaseInitialized() {
  return supabase !== null;
}