import { supabaseUrl, supabaseKey } from "./config.js";
export const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
