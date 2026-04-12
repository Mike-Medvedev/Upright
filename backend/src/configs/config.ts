import { z } from "zod";
import { EnvValidationError } from "@/lib/errors";

const configSchema = z.object({
  ROBOFLOW_API_KEY: z.string().min(1),
  PORT: z.string().min(1),
  VITE_SUPABASE_URL: z.string().min(1),
});

const env = {
  ROBOFLOW_API_KEY: process.env.ROBOFLOW_API_KEY,
  PORT: process.env.PORT,
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
};

const result = configSchema.safeParse(env);

if (!result.success) {
  throw new EnvValidationError("Error validating env vars", result.error);
}

const config = result.data;

export default config;
