import "./App.css";
import { useEffect, useRef } from "react";
import { connectors, webrtc, streams } from "@roboflow/inference-sdk";

const pc = async () => {
  // Create a connector pointing to your backend proxy
  const connector = connectors.withProxyUrl("/api/init-webrtc");

  // Start the stream
  const connection = await webrtc.useStream({
    source: await streams.useCamera({ video: true, audio: false }),
    connector: connector,
    wrtcParams: {
      workspaceName: "gilded-6esmg",
      workflowId: "custom-workflow-5",
      streamOutputNames: ["output_image"],
      dataOutputNames: ["posture_height", "status"],
      processingTimeout: 3600,
      requestedPlan: "webrtc-gpu-medium", // Options: webrtc-gpu-small, webrtc-gpu-medium, webrtc-gpu-large
      requestedRegion: "us", // Options: us, eu, ap,
      workflowsParameters: {
        is_calibrating: false,
        baseline_height: 100,
        threshold_ratio: 0.8,
      },
    },
    onData: (data) => console.log("Predictions:", data),
  });

  // Display the processed video
  const remoteStream = await connection.remoteStream();
  const videoElement = document.querySelector("video");
  videoElement.srcObject = remoteStream;
};

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    (async () => {
      await pc();
    })();
  }, []);

  return (
    <div className="app-container">
      <main className="main-container">
        {<video autoPlay ref={videoRef} width={500} height={500}></video>}
      </main>
    </div>
  );
}
