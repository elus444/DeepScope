import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// The anon key is designed to be public (it's what the browser is meant
// to hold) -- every actual permission check happens server-side via
// Postgres Row Level Security, scoped to whichever user's access token
// this client is currently holding.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
