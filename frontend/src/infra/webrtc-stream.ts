import { connectors, webrtc, streams } from "@roboflow/inference-sdk";
import type { WebRTCOutputData } from "@roboflow/inference-sdk";

const DEFAULT_WORKFLOWS_PARAMETERS: Record<string, unknown> = {
  is_calibrating: false,
  baseline_height: 100,
  threshold_ratio: 0.8,
  /** Cloud pipeline: drop backlog instead of slow-motion lag; process eagerly. */
  source_buffer_filling_strategy: "DROP_OLDEST",
  source_buffer_consumption_strategy: "EAGER",
};

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

export type WebRtcStreamConnection = Awaited<ReturnType<typeof webrtc.useStream>>;

export interface InitWebRtcStreamOptions {
  /** Merged into default workflow parameters (calibration, thresholds). */
  workflowsParameters?: Record<string, unknown>;
  onData?: (data: WebRTCOutputData) => void;
  /**
   * Use this camera stream for inference. If omitted, a new capture is opened via {@link streams.useCamera}.
   * Pass the same stream as the on-page local preview so the user does not get a second permission prompt.
   */
  source?: MediaStream;
}

/** Local camera only — no Roboflow / WebRTC. Use for idle preview on Monitoring. */
export async function getLocalCameraStream(): Promise<MediaStream> {
  return streams.useCamera(MONITORING_CAMERA_CONSTRAINTS);
}

/** Logs MediaStream / track settings (dev console). Remote WebRTC tracks often report empty `capabilities`. */
export function logMediaStreamDiagnostics(stream: MediaStream, label: string): void {
  const tracks = stream.getTracks();

  console.info(`[WebRTC diagnostics] ${label}`, {
    streamId: stream.id,
    active: stream.active,
    trackCount: tracks.length,
  });

  for (const track of tracks) {
    const settings = track.getSettings();
    const constraints = track.getConstraints();
    const capabilities =
      typeof track.getCapabilities === "function" ? track.getCapabilities() : undefined;

    console.info(`[WebRTC diagnostics] ${label} track`, {
      kind: track.kind,
      trackId: track.id,
      label: track.label,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState,
      settings,
      constraints,
      capabilities,
    });
  }
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

  const source = options.source ?? (await streams.useCamera(MONITORING_CAMERA_CONSTRAINTS));

  const connection = await webrtc.useStream({
    source,
    connector,
    wrtcParams: {
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
    },
    onData: options.onData ?? ((data) => console.log("Predictions:", data)),
    options: {
      disableInputStreamDownscaling: true,
    },
  });

  const remoteStream = await connection.remoteStream();
  logMediaStreamDiagnostics(remoteStream, "remote (Roboflow return)");

  video.srcObject = remoteStream;

  const onLoadedMetadata = () => {
    console.info("[WebRTC diagnostics] video element (decoded dimensions)", {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      clientWidth: video.clientWidth,
      clientHeight: video.clientHeight,
    });
    video.removeEventListener("loadedmetadata", onLoadedMetadata);
  };
  video.addEventListener("loadedmetadata", onLoadedMetadata);

  return connection;
}
