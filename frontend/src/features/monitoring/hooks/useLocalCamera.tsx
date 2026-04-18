import { cameraClient } from "@/infra/camera.client";
import { LocalCameraError } from "@/lib/errors";
import { useState, useEffect } from "react";

function useLocalCamera(enabled: boolean) {
  const [error, setError] = useState<Error | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled) {
      cameraClient.stop();
      return;
    }

    let disposed = false;

    cameraClient
      .getCamera()
      .then((stream) => {
        if (disposed) {
          cameraClient.stop();
          return;
        }
        setCameraStream(stream);
      })
      .catch((error) => {
        if (disposed) return;
        setError(
          new LocalCameraError(
            "Local camera could not be acquired.",
            error instanceof Error ? error.cause : undefined,
          ),
        );
      })

    return () => {
      disposed = true;
      cameraClient.stop();
      setError(null);
      setCameraStream(null);
    };
  }, [enabled]);

  return {
    cameraStream: enabled ? cameraStream : null,
    error: enabled ? error : null,
    isLoading: enabled && cameraStream == null && error == null,
  };
}
export default useLocalCamera;
