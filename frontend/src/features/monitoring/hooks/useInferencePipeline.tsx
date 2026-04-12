import { createVideoInferencePipeline } from "@/infra/video-inference.client";
import type { webrtc, WebRTCOutputData } from "@roboflow/inference-sdk";
import { useEffect, useRef } from "react";
export default function useInferencePipeline(
  stream: MediaStream | null,
  onData: (data: WebRTCOutputData) => void,
) {
  const connRef = useRef<webrtc.RFWebRTCConnection | null>(null);

  useEffect(() => {
    if (!stream) return;

    createVideoInferencePipeline(stream, onData).then((conn) => {
      connRef.current = conn;
    });

    return () => {
      connRef.current?.cleanup();
      connRef.current = null;
    };
  }, [stream]);
}
