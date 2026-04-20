import "./VideoCanvas.css";

interface VideoCanvasProps {
  videoRef: (node: HTMLVideoElement | null) => void;
  canvasRef: (node: HTMLCanvasElement | null) => void;
}

export default function VideoCanvas({ videoRef, canvasRef }: VideoCanvasProps) {
  return (
    <>
      <video autoPlay className="monitoringVideo" muted playsInline ref={videoRef} />
      <canvas aria-hidden="true" className="monitoringCanvas" ref={canvasRef} />
    </>
  );
}
