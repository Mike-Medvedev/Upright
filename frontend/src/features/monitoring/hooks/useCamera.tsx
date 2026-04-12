import { getLocalCameraStream } from "@/infra/camera";
import { LocalCameraError } from "@/lib/errors";
import { useState, useCallback, useEffect } from "react";

function useCamera() {
  const [camera, setCamera] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<LocalCameraError | null>(null);

  function start() {
    getLocalCameraStream()
      .then(setCamera)
      .catch((error) => setError(cameraError(error)))
      .finally(() => setIsLoading(false));
  }

  const stop = useCallback(() => {
    setCamera((current) => {
      current?.getTracks().forEach((track) => track.stop());
      return null;
    });
  }, []);

  useEffect(() => {
    start();
    return () => stop();
  }, [stop]);

  return { camera, isLoading, error };
}
export default useCamera;

function cameraError(error: unknown) {
  return new LocalCameraError(
    "Could not get local camera stream",
    error instanceof Error ? error : undefined,
  );
}
