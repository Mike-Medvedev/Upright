import { createVideoInferencePipeline } from "@/infra/video-inference.client";
import type { webrtc, WebRTCOutputData } from "@roboflow/inference-sdk";
import { useEffect, useRef, useState } from "react";
export default function useInferencePipeline(
  stream: MediaStream | null,
  onData: (data: WebRTCOutputData) => void,
) {
  const connRef = useRef<webrtc.RFWebRTCConnection | null>(null);
  const onDataRef = useRef(onData);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  useEffect(() => {
    if (!stream) return;

    createVideoInferencePipeline(stream, (data) => {
      setIsConnected(true);
      onDataRef.current(data);
    }).then((conn) => {
      connRef.current = conn;
    });

    return () => {
      connRef.current?.cleanup();
      connRef.current = null;
    };
  }, [stream]);

  return { isConnected };
}
