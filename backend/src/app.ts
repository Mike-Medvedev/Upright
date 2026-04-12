import express, { json } from "express";
import { swagger } from "meebo";
import cors from "cors";
import helmet from "helmet";
import { helloRouter } from "@/features/hello/hello.routes";
import { WebrtcController } from "@/features/webrtc/webrtc.controller";

export const app = express();

app.use(json());
app.use(cors());
app.use(helmet());

app.get("/health", (_, res) => {
  res.json({ status: "healthy" });
});

app.use("/api/v1", helloRouter);
app.use(swagger());

app.post("/init-webrtc", WebrtcController.initWebrtc);
