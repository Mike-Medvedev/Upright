import { connectors, webrtc, streams } from "@roboflow/inference-sdk";

export const init = async () => {
  // Create a connector pointing to your backend proxy
  const connector = connectors.withProxyUrl("/api/init-webrtc");

  // Start the stream
  const connection = await webrtc.useStream({
    source: await streams.useCamera({
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 30 },
      },
      audio: false,
    }),
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

  //   Display the processed video
  const remoteStream = await connection.remoteStream();
  const videoElement = document.querySelector("video");
  videoElement!.srcObject = remoteStream;
};
