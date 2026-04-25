import { useReducer } from "react";

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
  | { type: "RESET_CALIBRATION" };

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
    default:
      return state;
  }
}

export default function useCalibrationReducer() {
  return useReducer(calibrationReducer, initialState);
}
