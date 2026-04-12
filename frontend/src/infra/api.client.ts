import { client } from "@/generated/client.gen";
import { supabase } from "@/infra/auth/auth.client";
import { settings } from "@/settings";

let isConfigured = false;

export function initializeApiClient() {
  if (isConfigured) {
    return;
  }

  client.setConfig({
    auth: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token;
    },
    baseUrl: settings.apiUrl,
  });

  isConfigured = true;
}
