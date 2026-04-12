import { z } from "zod/v4";
import { ConfigurationError } from "@/lib/errors";

const settingsSchema = z.object({
  apiUrl: z.url(),
  supabaseUrl: z.url(),
  supabasePublishableKey: z.string().min(1),
});

const parsedSettings = settingsSchema.safeParse({
  apiUrl: import.meta.env.VITE_API_URL,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
});

if (!parsedSettings.success) {
  throw new ConfigurationError("Frontend environment variables are invalid.", {
    issues: z.treeifyError(parsedSettings.error),
  });
}

export const settings = parsedSettings.data;
