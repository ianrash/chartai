import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pofpmyiqjtwjesisytbd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZnBteWlxanR3amVzaXN5dGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDQxMTQsImV4cCI6MjA5MzgyMDExNH0.QLg0T5guEFKMrokjSQktUPkLysK_3TMav8fLS596hHs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseInitialized() {
  return true;
}