import { Button } from "@mantine/core";
import { monitoringService } from "../service/monitoring.service";
export default function InferenceOverlay({
  isLoading,
  isCalibrating,
  setCalibrating,
}: {
  isLoading: boolean;
  isCalibrating: boolean;
  setCalibrating: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  if (isLoading) {
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
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        justifyContent: "flex-end",
        height: "fit-content",
        padding: "1rem",
      }}>
      <Button
        disabled={isCalibrating}
        onClick={() => {
          setCalibrating(true);
          monitoringService.startCalibration();
        }}>
        Calibrate
      </Button>
    </div>
  );
}
