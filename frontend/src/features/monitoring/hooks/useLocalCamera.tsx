import { cameraClient } from "@/infra/camera.client";
import { LocalCameraError } from "@/lib/errors";
import { useState, useEffect } from "react";

function useLocalCamera() {
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  useEffect(() => {
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
            "Local Camerea could not be acquired",
            error instanceof Error ? error.cause : undefined,
          ),
        );
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
      cameraClient.stop();
    };
  }, []);

  return { cameraStream, isLoading, error };
}
export default useLocalCamera;
