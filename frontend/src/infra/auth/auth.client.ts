import { createClient } from "@supabase/supabase-js";
import { settings } from "@/settings";

export const supabase = createClient(
  settings.supabaseUrl,
  settings.supabasePublishableKey,
);
