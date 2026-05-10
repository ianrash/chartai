import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pofpmyiqjtwjesisytbd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZnBteWlzanR3amVzaXN0eWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwNjU3NjcsImV4cCI6MjA2MTY1MTc2N30.yVyXjG0J9U8QZ9xX6J5Z1K2N3H8P4F7E6D9C8B7A6X5Y4Z3W2V1U0T9S8R7Q6P5N4M3L2K1J0I";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseInitialized() {
  return true;
}