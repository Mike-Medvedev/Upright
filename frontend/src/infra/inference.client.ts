import { connectors, webrtc, type WebRTCOutputData } from "@roboflow/inference-sdk";
import { InferenceConnectionError } from "@/lib/errors";
import { settings } from "@/settings";

const inferenceProxyUrl = new URL("/init-webrtc", settings.apiUrl).toString();

const workflowsParameters = {
  is_calibrating: false,
  baseline_height: 100,
  threshold_ratio: 0.8,
};

//SubStep2. Configure web rtc connection paramters
const wrtcParams = {
  workspaceName: settings.roboflowWorkspaceName,
  workflowId: settings.roboflowWorkspaceId,
  streamOutputNames: [],
  dataOutputNames: ["output"],
  processingTimeout: 3600,
  requestedPlan: "webrtc-gpu-medium",
  requestedRegion: "us",
  realtimeProcessing: true,
  workflowsParameters,
};

class InferenceClient {
  private connection: webrtc.RFWebRTCConnection | null = null;

  async start(
    video: MediaStream,
    onData: (data: WebRTCOutputData) => void,
  ): Promise<webrtc.RFWebRTCConnection> {
    try {
      const connector = connectors.withProxyUrl(inferenceProxyUrl);

      this.connection = await webrtc.useStream({
        source: video,
        connector,
        wrtcParams: wrtcParams,
        onData,
      });

      return this.connection;
    } catch (error) {
      throw new InferenceConnectionError(
        "The inference API is unavailable. Check your connection and try again.",
        error,
      );
    }
  }
  stop() {
    this.connection?.cleanup();
  }
}

export const inferenceClient = new InferenceClient();
/**
 * AbstractionsL
 * I have the actualy roboflow werbrtc connection which requires specific configurations, a video stream and a callback on what to do with data
 * I need to re render react when i get the first prediction so i need statefulness there
 * Okay so i can have the initial wrapper layer which calls and configures the roboflow configs which should be roboflow infra specific
 * Then I can simply call that from a react component layer which passes the video stream and callback and also updates the UI on first prediction
 */
