import { inferenceClient } from "@/infra/inference.client";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { InferenceOutputData } from "@/features/monitoring/monitoring.types";
import useLocalCamera from "@/features/monitoring/hooks/useLocalCamera";

export function useLiveVideoInference(onData: (data: InferenceOutputData) => void) {
  const { cameraStream } = useLocalCamera();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const handleData = useEffectEvent(onData); //always uses latest onData and stabilizies it

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    if (!cameraStream) {
      return;
    }
    let disposed = false;

    inferenceClient
      .start(cameraStream, handleData)
      .then(() => {
        if (!disposed) setLoading(false);
      })
      .catch((error) => {
        if (!disposed) {
          setError(error);
          setLoading(false);
        }
      });

    return () => {
      disposed = true;
      inferenceClient.stop();
    };
  }, [cameraStream]);

  return { videoRef, isLoading, error };
}
