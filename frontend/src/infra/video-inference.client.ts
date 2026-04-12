import { connectors, webrtc, type WebRTCOutputData } from "@roboflow/inference-sdk";

const workflowsParameters = {
  is_calibrating: false,
  baseline_height: 100,
  threshold_ratio: 0.8,
};

//SubStep2. Configure web rtc connection paramters
const wrtcParams = {
  workspaceName: "gilded-6esmg",
  workflowId: "custom-workflow-5",
  streamOutputNames: ["output_image"],
  dataOutputNames: ["posture_height", "status"],
  processingTimeout: 3600,
  requestedPlan: "webrtc-gpu-medium",
  requestedRegion: "us",
  realtimeProcessing: true,
  workflowsParameters,
};

export async function createVideoInferencePipeline(
  video: MediaStream,
  onData: (data: WebRTCOutputData) => void,
): Promise<webrtc.RFWebRTCConnection> {
  const connector = connectors.withProxyUrl("/api/init-webrtc");
  const connection = await webrtc.useStream({
    source: video,
    connector,
    wrtcParams: wrtcParams,
    onData,
  });

  return connection;
}
