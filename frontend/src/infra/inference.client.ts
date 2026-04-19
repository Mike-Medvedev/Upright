import { connectors, webrtc, type WebRTCOutputData } from "@roboflow/inference-sdk";
import { InferenceConnectionError } from "@/lib/errors";
import { settings } from "@/settings";

const inferenceProxyUrl = new URL("/init-webrtc", settings.apiUrl).toString();

const wrtcParams = {
  workspaceName: settings.roboflowWorkspaceName,
  workflowId: settings.roboflowWorkspaceId,
  streamOutputNames: [],
  dataOutputNames: ["output"],
  processingTimeout: 3600,
  requestedPlan: "webrtc-gpu-medium",
  requestedRegion: "us",
  realtimeProcessing: true,
};

/**
 * Manages a WebRTC connection with Roboflow via a backend proxy.
 * This client pipes a video stream to Roboflow for real-time inference
 * and handles incoming predictions via a provided callback.
 */
class InferenceClient {
  private connection: webrtc.RFWebRTCConnection | null = null;

  /**
   * Initializes the WebRTC connection and begins streaming video for inference.
   * @param video - The source MediaStream from the user's camera.
   * @param onData - Callback function triggered when Roboflow sends back live video inference data.
   * @returns A promise resolving to the established RFWebRTCConnection.
   * @throws {InferenceConnectionError} If the proxy is unreachable or the handshake fails.
   */
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
