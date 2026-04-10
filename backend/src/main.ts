import express, { json } from "express";
import "dotenv/config";
import { TypedRouter, swagger } from "meebo";
import config from "@/config";
import { z } from "zod";
import cors from "cors";
import helmet from "helmet";
import { WebSocketServer } from "ws";

import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, IceCandidate } from "werift";

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
// const pc = new RTCPeerConnection({
//   iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
// });
// pc.onIceCandidate.subscribe((candidate) => {
//   if (!candidate) {
//     console.log("node ICE gathering complete");
//     return;
//   }
//   console.log("SEND NODE CANDIDATE TO BROWSER:", JSON.stringify(candidate));
// });
// pc.onDataChannel.subscribe((channel) => {
//   console.log("data channel:", channel.label);

//   channel.onMessage.subscribe((msg) => {
//     console.log("from browser:", msg.toString());
//     channel.send("hello from node");
//   });

//   channel?.onopen?.subscribe(() => {
//     console.log("data channel open");
//   });
// });

// // If browser sends media tracks
// pc.onTrack.subscribe((track) => {
//   console.log("got remote track:", track.kind);
// });

// export async function handleBrowserOffer(offerSdp: string) {
//   await pc.setRemoteDescription(new RTCSessionDescription(offerSdp, "offer"));

//   const answer = await pc.createAnswer();
//   await pc.setLocalDescription(answer);

//   return pc.localDescription; // send this SDP back to browser
// }

// export async function addBrowserIceCandidate(candidateJson: any) {
//   const candidate = RTCIceCandidate.fromJSON(candidateJson);
//   if (candidate) {
//     await pc.addIceCandidate(candidate);
//   }
// }
app.use("/api/v1", router);
app.use(swagger());

const server = app.listen(config.PORT, () => {
  console.log(`Server listening on port ${config.PORT}`);
});

const wss = new WebSocketServer({ server });
wss.on("listening", () => console.log("Websocket listening..."));
wss.on("connection", (ws, req) => {
  console.log("WebSocket connected", req.url);

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  pc.onconnectionstatechange = () => {
    console.log(pc.connectionState);
  };

  pc.onTrack.subscribe((track) => {
    console.log("PRINTING OUT TRACK", track);
    track.onReceiveRtp.subscribe((packet) => console.log(packet));
    // track.onReceiveRtcp.subscribe((rtcp) => console.log(rtcp));
  });

  pc.onIceCandidate.subscribe((candidate) => {
    if (!candidate) return;
    ws.send(JSON.stringify({ candidate }));
  });

  pc.onDataChannel.subscribe((channel) => {
    channel.onMessage.subscribe((msg) => {
      console.log("Video Frames", msg.toString());
    });
  });

  ws.on("message", async (message) => {
    let data: any;

    try {
      data = JSON.parse(message.toString());
    } catch {
      return;
    }
    console.log(data);
    if ("offer" in data) {
      await pc.setRemoteDescription(data.offer);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log(answer);
      ws.send(JSON.stringify({ answer }));
    } else if ("candidate" in data) {
      await pc.addIceCandidate(data.candidate);
    } else console.log("NO OFFER OR CANDIDATE IN MESSAGE: ", data);
  });
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
