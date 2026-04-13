export function InferenceOverlay({ isConnected }: { isConnected: boolean }) {
  if (isConnected) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
      }}>
      <p>Connecting to inference...</p>
    </div>
  );
}
