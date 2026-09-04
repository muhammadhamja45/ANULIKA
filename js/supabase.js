// Single shared Supabase client. Every module imports `supabase` from here.
// Relies on the UMD build loaded via <script> before this module runs (see any page's <head>).
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
