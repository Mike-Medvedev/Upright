import "dotenv/config";
import config from "@/configs/config";
import { app } from "./app";

const server = app.listen(config.PORT, () => {
  console.log(`Server listening on port ${config.PORT}`);
});

function shutdown(signal?: string) {
  console.log(`Gracefully shutting down due to ${signal}`);

  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Force shutdown");
    process.exit(1);
  }, 5000);
}

function handleFatalError(err: unknown) {
  console.error("Fatal error:", err);

  shutdown("fatal");
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

process.on("uncaughtException", handleFatalError);
process.on("unhandledRejection", handleFatalError);
