import { client } from "@/generated/client.gen";
import { supabase } from "@/infra/auth/auth.client";
import { settings } from "@/settings";

client.setConfig({
  async auth() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  },
  baseUrl: settings.apiUrl,
});
