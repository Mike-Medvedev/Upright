import express, { json } from "express";
import "dotenv/config";
import { TypedRouter, swagger } from "meebo";
import config from "@/config";
import { z } from "zod";
import cors from "cors";
import helmet from "helmet";

const app = express();

const router = TypedRouter(express.Router(), { basePath: "/api/v1" });

router.get(
  "/",
  {
    response: z.record(z.any(), z.any()),
    summary: "Hello World",
    tags: ["Hello"],
  },
  (req, res) => {
    res.json({ Hello: "World" });
  },
);

app.use(json());
app.use(cors());
app.use(helmet());
app.use("/api/v1", router);
app.use(swagger());

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
