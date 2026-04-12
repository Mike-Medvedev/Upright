import { connectors, webrtc, streams } from "@roboflow/inference-sdk";
import type { WebRTCOutputData } from "@roboflow/inference-sdk";

const DEFAULT_WORKFLOWS_PARAMETERS: Record<string, unknown> = {
  is_calibrating: false,
  baseline_height: 100,
  threshold_ratio: 0.8,
};

export type WebRtcStreamConnection = Awaited<ReturnType<typeof webrtc.useStream>>;

export interface InitWebRtcStreamOptions {
  /** Merged into default workflow parameters (calibration, thresholds). */
  workflowsParameters?: Record<string, unknown>;
  onData?: (data: WebRTCOutputData) => void;
}

/**
 * Starts Roboflow WebRTC inference and binds the processed {@link MediaStream} to `video`.
 * Call {@link WebRtcStreamConnection.cleanup} when done.
 */
export async function initWebRtcStream(
  video: HTMLVideoElement,
  options: InitWebRtcStreamOptions = {},
): Promise<WebRtcStreamConnection> {
  const connector = connectors.withProxyUrl("/api/init-webrtc");

  const workflowsParameters = {
    ...DEFAULT_WORKFLOWS_PARAMETERS,
    ...options.workflowsParameters,
  };

  const connection = await webrtc.useStream({
    source: await streams.useCamera({
      video: {
        facingMode: "user",
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        frameRate: { ideal: 60, max: 60 },
      },
      audio: false,
    }),
    connector,
    wrtcParams: {
      workspaceName: "gilded-6esmg",
      workflowId: "custom-workflow-5",
      streamOutputNames: ["output_image"],
      dataOutputNames: ["posture_height", "status"],
      processingTimeout: 3600,
      requestedPlan: "webrtc-gpu-medium",
      requestedRegion: "us",
      workflowsParameters,
    },
    onData: options.onData ?? ((data) => console.log("Predictions:", data)),
  });

  const remoteStream = await connection.remoteStream();
  video.srcObject = remoteStream;

  return connection;
}
