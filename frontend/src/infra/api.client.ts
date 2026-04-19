/**
 * This module exports the generated api client based on our backends openapi.json spec
 */
import { createClient } from "@/generated/client/client.gen";
import { supabase } from "@/infra/auth/auth.client";
import { settings } from "@/settings";

export const apiClient = createClient();

apiClient.setConfig({
  async auth() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  },
  baseUrl: settings.apiUrl,
});
