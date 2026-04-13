import { inferenceClient } from "@/infra/inference.client";
import { useEffect, useEffectEvent, useState } from "react";
import type { InferenceOutputData } from "@/features/monitoring/monitoring.types";
import useLocalCamera from "@/features/monitoring/hooks/useLocalCamera";

interface LiveVideoInterfaceProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onData: (data: InferenceOutputData) => void;
}

export function useLiveVideoInference({ videoRef, onData }: LiveVideoInterfaceProps) {
  const { cameraStream } = useLocalCamera();
  const [error, setError] = useState<Error | null>(null);

  const handleData = useEffectEvent(onData); //always uses latest onData and stabilizies it

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, videoRef]);

  useEffect(() => {
    if (!cameraStream) {
      return;
    }
    let disposed = false;

    inferenceClient.start(cameraStream, handleData).catch((error) => {
      if (!disposed) {
        setError(error);
      }
    });

    return () => {
      disposed = true;
      inferenceClient.stop();
    };
  }, [cameraStream]);

  return { error };
}
