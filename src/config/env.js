import { getApiKey } from "../api/gemini";

const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://pofpmyiqjtwjesisytbd.supabase.co";
const VITE_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const { VITE_GOOGLE_API_KEY, VITE_OPENROUTER_API_KEY } = getApiKey();
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://chartai-wy7a.onrender.com";

const missing = [];
if (!VITE_SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
if (!VITE_SUPABASE_ANON_KEY) missing.push("VITE_SUPABASE_ANON_KEY");
if (!VITE_GOOGLE_API_KEY && !VITE_OPENROUTER_API_KEY) missing.push("VITE_GOOGLE_API_KEY or VITE_OPENROUTER_API_KEY");
if (!VITE_BACKEND_URL) missing.push("VITE_BACKEND_URL");

export {
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY,
  VITE_GOOGLE_API_KEY,
  VITE_OPENROUTER_API_KEY,
  VITE_BACKEND_URL,
};

export const ENV_WARNING = missing.length > 0
  ? `Missing env vars: ${missing.join(", ")}. Create .env file from .env.example`
  : "";

export default {
  supabase: { url: VITE_SUPABASE_URL, anonKey: VITE_SUPABASE_ANON_KEY },
  ai: { googleKey: VITE_GOOGLE_API_KEY, openrouterKey: VITE_OPENROUTER_API_KEY },
  backend: { url: VITE_BACKEND_URL },
};