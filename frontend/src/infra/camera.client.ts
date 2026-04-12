import { LocalCameraError } from "@/lib/errors";
import { connectors, streams, webrtc } from "@roboflow/inference-sdk";

/** Shared constraints for local preview and Roboflow ingest (no WebRTC until inference starts). */
const MONITORING_CAMERA_CONSTRAINTS = {
  video: {
    facingMode: "user" as const,
    width: { ideal: 1920, min: 1280 },
    height: { ideal: 1080, min: 720 },
    frameRate: { ideal: 60, max: 60 },
  },
  audio: false,
};

/**
 *
 * Step 1. Get user camera
 */
/** Local camera only — no Roboflow / WebRTC. Use for idle preview on Monitoring. */
export async function getLocalCameraStream(): Promise<MediaStream> {
  return streams.useCamera({ video: { facingMode: { exact: "user" } }, audio: false });
}

/**
 * Step2. Establish Connection to Roboflow Inference
 */
const connector = connectors.withProxyUrl("/api/init-webrtc");

let localCameraStream;
try {
  localCameraStream = await getLocalCameraStream();
} catch (error: unknown) {
  throw new LocalCameraError(
    "Could not get local camera stream",
    error instanceof Error ? error.cause : undefined,
  );
}

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
const connection = await webrtc.useStream({
  source: localCameraStream,
  connector,
  wrtcParams,
  onData: onData,
});
