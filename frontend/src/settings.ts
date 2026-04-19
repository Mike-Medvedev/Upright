/**
 * This module validates environment variables at runtime when the first application starts
 * If any variables defined in the zod schema are missing or malformed
 * the application will fail, preventing future failures from missing envs
 */

import { z } from "zod/v4";
import { ConfigurationError } from "@/lib/errors";

const settingsSchema = z.object({
  apiUrl: z.url(),
  supabaseUrl: z.url(),
  supabasePublishableKey: z.string().min(1),
  roboflowWorkspaceName: z.string().min(1),
  roboflowWorkspaceId: z.string().min(1),
});

const parsedSettings = settingsSchema.safeParse({
  apiUrl: import.meta.env.VITE_API_URL,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  roboflowWorkspaceName: import.meta.env.VITE_ROBOFLOW_WORKSPACE_NAME,
  roboflowWorkspaceId: import.meta.env.VITE_ROBOFLOW_WORKFLOW_ID,
});

if (!parsedSettings.success) {
  throw new ConfigurationError("Frontend environment variables are invalid.", {
    issues: z.treeifyError(parsedSettings.error),
  });
}

/**
 * Validated application configuration settings.
 * @throws {ConfigurationError} If environment variables fail validation at runtime.
 */
export const settings = parsedSettings.data;
