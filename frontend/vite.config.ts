import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { heyApiPlugin } from "@hey-api/vite-plugin";
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const BASE_URL = env.VITE_API_URL;
  return {
    plugins: [
      react(),
      heyApiPlugin({
        config: {
          input: "./openapi.json",
          output: "src/generated",
          plugins: [
            "@hey-api/typescript",
            {
              name: "@hey-api/sdk",
              validator: true,
            },
            "zod",
            "@tanstack/react-query",
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: BASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        "/ws": {
          target: BASE_URL.replace(/http/, "ws"),
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
