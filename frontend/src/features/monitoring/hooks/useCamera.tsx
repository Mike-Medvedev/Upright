import { streams } from "@roboflow/inference-sdk";
import { LocalCameraError } from "@/lib/errors";
import { useState, useEffect } from "react";
/**
 *
 * Step 1. Get user camera
 */
/** Local camera only — no Roboflow / WebRTC. Use for idle preview on Monitoring. */
function useCamera() {
  const [camera, setCamera] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<LocalCameraError | null>(null);

  useEffect(() => {
    getLocalCameraStream()
      .then(setCamera)
      .catch((error) =>
        setError(
          new LocalCameraError(
            "Could not get local camera stream",
            error instanceof Error ? error : undefined,
          ),
        ),
      )
      .finally(() => setIsLoading(false));
  }, []);

  async function getLocalCameraStream(): Promise<MediaStream> {
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

  return { camera, isLoading, error };
}

export default useCamera;
