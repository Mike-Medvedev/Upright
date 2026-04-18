import type { MonitoringSessionStatus } from "@/features/monitoring/monitoring.types";
import InferenceOverlay from "@/features/monitoring/components/InferenceOverlay";
import VideoCanvas from "@/features/monitoring/components/VideoCanvas";

interface CameraPreviewProps {
  videoRef: (node: HTMLVideoElement | null) => void;
  canvasRef: (node: HTMLCanvasElement | null) => void;
  status: MonitoringSessionStatus;
  calibrationProgress: number;
  errorMessage: string | null;
}

export function CameraPreview({
  videoRef,
  canvasRef,
  status,
  calibrationProgress,
  errorMessage,
}: CameraPreviewProps) {
  return (
    <div className="monitoringVideoShell">
      <VideoCanvas videoRef={videoRef} canvasRef={canvasRef} />
      <InferenceOverlay
        calibrationProgress={calibrationProgress}
        errorMessage={errorMessage}
        status={status}
      />
    </div>
  );
}
