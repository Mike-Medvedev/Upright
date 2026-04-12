import { connectors, webrtc } from "@roboflow/inference-sdk";
import { getLocalCameraStream } from "@/infra/camera";
/**
 * Step2. Establish Connection to Roboflow Inference
 */

const connector = connectors.withProxyUrl("/api/init-webrtc");

const liveCameraFeed = await getLocalCameraStream();

//SubStep1. Configure Input pameters for workflow
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
  /** Drop frames when behind instead of stuttering / “slow motion”. */
  realtimeProcessing: true,
  workflowsParameters,
};

//SubStep3. Configure handler for recieving workflow predictions
const onData = (data: webrtc.WebRTCOutputData) => {
  console.log("Predictions:", data);
};

//SubStep4, attempt to actually create a WebRTC connection to Roboflow for real-time inference on video streams.
export const connection = await webrtc.useStream({
  source: liveCameraFeed,
  connector,
  wrtcParams,
  onData: onData ?? ((data: webrtc.WebRTCOutputData) => console.log("Predictions:", data)),
});
