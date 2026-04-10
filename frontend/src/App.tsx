import "./App.css";
import { useEffect, useRef } from "react";
import { ws } from "@/websocket";
// import { connectors, webrtc, streams } from "@roboflow/inference-sdk";

// // ⚠️ Use withApiKey for development only
// // ⚠️ Do not use this in production, because it will expose your API key
// // For production, use a backend proxy (see next section)
// const connector = connectors.withApiKey("rf_IDQ7O7kE72NFYPEuBLQS27tkpsF3");

// // Get camera stream
// const stream = await streams.useCamera({
//   video: {
//     facingMode: { ideal: "environment" },
//     width: { ideal: 640 },
//     height: { ideal: 480 },
//   },
// });

// // Start WebRTC connection
// const connection = await webrtc.useStream({
//   source: stream,
//   connector,
//   wrtcParams: {
//     workspaceName: "your-workspace",
//     workflowId: "your-workflow",
//     imageInputName: "image",
//     streamOutputNames: ["output"],
//     dataOutputNames: ["predictions"],
//   },
//   onData: (data) => {
//     console.log("Inference results:", data);
//   },
// });

// // Display processed video
// const videoElement = document.getElementById("video");
// videoElement.srcObject = await connection.remoteStream();

// // Clean up when done
// await connection.cleanup();

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const isRTCOfferAnswered = useRef<boolean>(false);

  useEffect(() => {
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      console.log("PRINTING TRACKS", stream.getTracks());
      videoRef.current.srcObject = stream;
      const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
      const rtcConnection = new RTCPeerConnection(config);
      for (const track of stream.getTracks()) {
        rtcConnection.addTrack(track, stream);
      }
      const channel = rtcConnection.createDataChannel("chat");

      channel.onopen = () => {
        console.log("data channel open");
        channel.send("hello");
      };

      channel.onmessage = (event) => {
        console.log("message from backend:", event.data);
      };
      rtcConnection.onicecandidate = async (event) => {
        console.log(" GATHERED AND SENDING ICE CANDIDATE");
        if (!event.candidate) return;
        ws.send(JSON.stringify({ candidate: event.candidate }));
      };

      rtcConnection.onnegotiationneeded = async (event) => {
        console.log("PRINTING EVENT OF NEGOTATION", event);
        const offer = await rtcConnection.createOffer();
        await rtcConnection.setLocalDescription(offer);
        ws.send(JSON.stringify({ offer }));
      };

      ws.onmessage = async (data) => {
        console.log("RECIEVED WEBSOCKET MESSAGE", data);
        const message = JSON.parse(data.data);
        console.log("RAW MESSAGE", message);

        if ("answer" in message) {
          await rtcConnection.setRemoteDescription(message.answer);
          isRTCOfferAnswered.current = true;
          iceCandidateQueue.current.forEach((candidate) =>
            rtcConnection.addIceCandidate(candidate),
          );
        } else if ("candidate" in message) {
          if (isRTCOfferAnswered.current) await rtcConnection.addIceCandidate(message.candidate);
          else iceCandidateQueue.current.push(message.candidate);
        } else console.log("recieved unknown message");
      };
    })();
  });
  return (
    <div className="app-container">
      <main className="main-container">
        <button style={{ padding: "1rem" }}></button>
        {<video autoPlay ref={videoRef} width={500} height={500}></video>}
      </main>
    </div>
  );
}
