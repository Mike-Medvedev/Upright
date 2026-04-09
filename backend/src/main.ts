import express, { json } from "express";
import "dotenv/config";
import { TypedRouter, swagger } from "meebo";
import config from "@/config";
import { z } from "zod";
import cors from "cors";
import helmet from "helmet";

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
const pc = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
});
pc.onIceCandidate.subscribe((candidate) => {
  if (!candidate) {
    console.log("node ICE gathering complete");
    return;
  }
  console.log("SEND NODE CANDIDATE TO BROWSER:", JSON.stringify(candidate));
});
pc.onDataChannel.subscribe((channel) => {
  console.log("data channel:", channel.label);

  channel.onMessage.subscribe((msg) => {
    console.log("from browser:", msg.toString());
    channel.send("hello from node");
  });
});
app.post("/wrtc", async (req, res) => {
  const { candidate, offer } = req.body;
  if (offer) {
    await pc.setRemoteDescription(new RTCSessionDescription(offer.sdp, "offer"));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return res.json({ answer });
  }
  if (candidate) {
    const rtcCandidate = new RTCIceCandidate(candidate);
    await pc.addIceCandidate(rtcCandidate);
    return res.json({ ok: true });
  } else {
    return res.json({ response: "There was no candidate or offer found" });
  }
});

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
