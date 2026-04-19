import express, { json } from "express";
import cors from "cors";
import helmet from "helmet";
import { WebrtcController } from "@/features/webrtc/webrtc.controller";

export const app = express();

app.use(json());
app.use(cors());
app.use(helmet());

app.get("/health", (_, res) => {
  res.json({ status: "healthy" });
});

app.post("/init-webrtc", WebrtcController.initWebrtc);
