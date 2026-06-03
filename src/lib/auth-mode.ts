const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const explicitBypass = import.meta.env.VITE_BYPASS_AUTH === "true";
const missingSupabaseConfig = !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY;

// Temporary mode to unblock feature development before auth/backend integration is ready.
export const BYPASS_AUTH = explicitBypass || missingSupabaseConfig;