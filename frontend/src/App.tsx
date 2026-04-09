import "./App.css";
import { useEffect, useRef } from "react";
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
  useEffect(() => {
    (async () => {
      const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
      const rtcConnection = new RTCPeerConnection(config);
      const channel = rtcConnection.createDataChannel("chat");

      channel.onopen = () => {
        console.log("data channel open");
        channel.send("hello");
      };

      channel.onmessage = (event) => {
        console.log("message from backend:", event.data);
      };
      rtcConnection.onicecandidate = async (event) => {
        console.log(event);
        if (!event.candidate) return;
        const result = await fetch("/api/wrtc", {
          method: "POST",
          body: JSON.stringify({ candidate: event.candidate }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!result.ok) {
          console.error("Error sending ICE candidate", result.status);
          throw new Error("Cant send ICE candidate");
        }
      };

      rtcConnection.onnegotiationneeded = async () => {
        const offer = await rtcConnection.createOffer();
        await rtcConnection.setLocalDescription(offer);
        const result = await fetch("/api/wrtc", {
          method: "POST",
          body: JSON.stringify({ offer }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!result.ok) {
          console.error("Error sending wrtc offer", result.status);
          throw new Error("Cant connect to wrtc signal");
        } else {
          const { answer } = await result.json();
          await rtcConnection.setRemoteDescription(answer);
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      videoRef.current.srcObject = stream;
    })();
  });
  return (
    <div className="app-container">
      <main className="main-container">
        <video autoPlay ref={videoRef} width={500} height={500}></video>
      </main>
    </div>
  );
}
