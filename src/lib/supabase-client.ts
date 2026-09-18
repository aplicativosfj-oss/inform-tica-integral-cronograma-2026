import { createClient } from "@supabase/supabase-js";

// The Supabase project URL and publishable (anon) key are not secrets — they
// are meant to ship in the client bundle, the same way they'd sit in a
// public HTML page. Hardcoded here (with an env var override for local
// development) because the hosting platform doesn't support build-time
// secrets on every plan. Write access is still enforced server-side by
// Supabase's row-level security policies, which is what actually matters.
const supabaseUrl =
  import.meta.env["VITE_SUPABASE_URL"] || "https://ouxxmntamhjwuyqnzraa.supabase.co";
const supabaseKey =
  import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
  "sb_publishable_HxIK9pHPX1wyFOtcKmdhIQ_O-_nn-bh";

export const supabase = createClient(supabaseUrl, supabaseKey);
