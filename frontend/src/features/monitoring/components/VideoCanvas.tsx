interface VideoCanvasProps {
  videoRef: (node: HTMLVideoElement | null) => void;
  canvasRef: (node: HTMLCanvasElement | null) => void;
}
export default function VideoCanvas({ videoRef, canvasRef }: VideoCanvasProps) {
  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        style={{ width: "100%", height: "100%", display: "block" }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    </>
  );
}
