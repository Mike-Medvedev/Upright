import { TypedRouter, swagger } from "meebo";
import express, { json } from "express";
import cors from "cors";
import helmet from "helmet";
import { WebrtcController } from "@/features/webrtc/webrtc.controller";

export const app = express();
const router = TypedRouter(express.Router());

app.use(json());
app.use(cors());
app.use(helmet());

router.get(
  "/health",
  { skipValidation: true, summary: "Health check to validate api health" },
  (_, res) => {
    res.json({ status: "healthy" });
  },
);

router.post(
  "/init-webrtc",
  {
    skipValidation: true,
    summary: "Proxy endpoint for opening a webrtc connection with roboflow live inference api",
  },
  WebrtcController.initWebrtc,
);

app.use(router);
app.use(swagger());
