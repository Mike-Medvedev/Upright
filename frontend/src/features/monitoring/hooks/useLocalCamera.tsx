import { getLocalCameraStream } from "@/infra/camera";
import { LocalCameraError } from "@/lib/errors";
import { useState, useCallback, useEffect, useRef } from "react";

function useLocalCamera() {
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<LocalCameraError | null>(null);

  const start = useCallback(() => {
    getLocalCameraStream()
      .then((stream) => {
        cameraStreamRef.current = stream;
        setCameraStream(stream); // triggers re-render so CameraPreview can react
      })
      .catch((error) => setError(cameraError(error)))
      .finally(() => setIsLoading(false));
  }, []);

  const stop = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setCameraStream(null);
  }, []);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  return { cameraStream, isLoading, error };
}
export default useLocalCamera;

function cameraError(error: unknown) {
  return new LocalCameraError(
    "Could not get local camera stream",
    error instanceof Error ? error : undefined,
  );
}
