import { streams } from "@roboflow/inference-sdk";
import { LocalCameraError } from "@/lib/errors";
/**
 *
 * Step 1. Get user camera
 */
/** Local camera only — no Roboflow / WebRTC. Use for idle preview on Monitoring. */
export async function getLocalCameraStream(): Promise<MediaStream> {
  return streams
    .useCamera({
      video: {
        facingMode: { ideal: "user" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
      audio: false,
    })
    .catch((error) => {
      throw new LocalCameraError(
        "Could not get local camera stream",
        error instanceof Error ? error.cause : undefined,
      );
    });
}
