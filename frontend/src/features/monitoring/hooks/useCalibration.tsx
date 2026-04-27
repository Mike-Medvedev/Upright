import { IntervalTimer } from "@/lib/IntervalTimer";
import { useReducer, useRef } from "react";
import { monitoringService } from "../service/monitoring.service";

interface CalibrationState {
  calibrationProgress: number;
  calibrationCountdown: number | null;
  isCalibrating: boolean;
  hasCalibratedThisSession: boolean;
}

type Action =
  | { type: "CALIBRATION_PROGRESS_UPDATE"; progress: number }
  | { type: "START_CALIBRATION" }
  | { type: "COMPLETE_CALIBRATION" }
  | { type: "RESET_CALIBRATION" }
  | { type: "TICK" };

const initialState: CalibrationState = {
  calibrationProgress: 0,
  calibrationCountdown: null,
  isCalibrating: false,
  hasCalibratedThisSession: false,
};

function calibrationReducer(state: CalibrationState, action: Action): CalibrationState {
  switch (action.type) {
    case "START_CALIBRATION":
      return { ...state, calibrationProgress: 0, calibrationCountdown: 3, isCalibrating: false };
    case "COMPLETE_CALIBRATION":
      return {
        ...state,
        calibrationProgress: 100,
        isCalibrating: false,
        hasCalibratedThisSession: false,
      };
    case "RESET_CALIBRATION":
      return {
        calibrationProgress: 0,
        calibrationCountdown: null,
        isCalibrating: false,
        hasCalibratedThisSession: false,
      };
    case "CALIBRATION_PROGRESS_UPDATE":
      return { ...state, calibrationProgress: action.progress };
    case "TICK":
      if (state.calibrationCountdown === null) return state;
      if (state.calibrationCountdown === 1)
        return {
          ...state,
          calibrationCountdown: null,
          isCalibrating: true,
          calibrationProgress: 0,
        };
      return { ...state, calibrationCountdown: state.calibrationCountdown - 1 };

    default:
      return state;
  }
}

export default function useCalibration() {
  const [state, dispatch] = useReducer(calibrationReducer, initialState);
  const calibrationCountdownTimerRef = useRef(new IntervalTimer());

  function startCalibration() {
    dispatch({ type: "START_CALIBRATION" });
    calibrationCountdownTimerRef.current.start(() => dispatch({ type: "TICK" }), 1000);
    monitoringService.startCalibration();
  }

  function stopCalibration() {
    calibrationCountdownTimerRef.current.stop();
    dispatch({ type: "RESET_CALIBRATION" });
  }

  function completeCalibration() {
    dispatch({ type: "COMPLETE_CALIBRATION" });
  }

  function updateCalibrationProgress(progress: number) {
    dispatch({ type: "CALIBRATION_PROGRESS_UPDATE", progress });
  }

  return {
    state,
    startCalibration,
    stopCalibration,
    completeCalibration,
    updateCalibrationProgress,
  };
}
