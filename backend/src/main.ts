import express, { json } from "express";
import "dotenv/config";
import { TypedRouter, swagger } from "meebo";
import config from "@/config";
import { z } from "zod";
import cors from "cors";
import helmet from "helmet";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { InferenceHTTPClient } = require("@roboflow/inference-sdk");
// import { InferenceHTTPClient } from "@roboflow/inference-sdk";

const app = express();
app.use(json());
app.use(cors());
app.use(helmet());

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

app.use("/api/v1", router);
app.use(swagger());

app.post("/init-webrtc", async (req, res) => {
  console.log("GOT REQUEST");
  const { offer, wrtcParams } = req.body;

  // API key stays secure on the server
  const client = InferenceHTTPClient.init({
    apiKey: config.ROBOFLOW_API_KEY,
  });

  const answer = await client.initializeWebrtcWorker({
    offer,
    workspaceName: wrtcParams.workspaceName,
    workflowId: wrtcParams.workflowId,
    config: {
      streamOutputNames: wrtcParams.streamOutputNames,
      dataOutputNames: wrtcParams.dataOutputNames,
      workflowsParameters: wrtcParams.workflowsParameters,
      requestedPlan: wrtcParams.requestedPlan,
      requestedRegion: wrtcParams.requestedRegion,
      // realtimeProcessing: wrtcParams.realtimeProcessing,
      processingTimeout: wrtcParams.processingTimeout,
    },
  });

  res.json(answer);
});

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
