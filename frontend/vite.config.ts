import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { heyApiPlugin } from "@hey-api/vite-plugin";
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [
      react(),
      heyApiPlugin({
        config: {
          input: `${env.VITE_API_URL}/docs/openapi.json`,
          output: "src/client",
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
          target: "http://localhost:3000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        "/ws": {
          target: "ws://localhost:3000",
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
