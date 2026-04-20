import { monitoringService } from "@/features/monitoring/service/monitoring.service";
import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

export function useCalibrationCountdown(
  calibrationCountdown: number | null,
  setCalibrationCountdown: Dispatch<SetStateAction<number | null>>,
  setProgress: Dispatch<SetStateAction<number>>,
  setCalibrating: Dispatch<SetStateAction<boolean>>,
) {
  useEffect(() => {
    if (calibrationCountdown === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (calibrationCountdown === 1) {
        setCalibrationCountdown(null);
        setProgress(0);
        setCalibrating(true);
        monitoringService.startCalibration();
        return;
      }

      setCalibrationCountdown((current) => (current == null ? null : current - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [calibrationCountdown, setCalibrating, setCalibrationCountdown, setProgress]);
}
