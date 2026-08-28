import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://pofpmyiqjtwjesisytbd.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZnBteWlxanR3amVzaXN5dGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDQxMTQsImV4cCI6MjA5MzgyMDExNH0.QLg0T5guEFKMrokjSQktUPkLysK_3TMav8fLS596hHs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseInitialized() {
  return !!(supabaseUrl && supabaseAnonKey);
}