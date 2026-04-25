import { useReducer } from "react";

interface CalibrationState {
  calibrationProgress: number;
  calibrationCountdown: number | null;
  isCalibrating: boolean;
  requiresCalibration: boolean;
  hasCalibratedThisSession: boolean;
}

type Action = {
  type: string;
} & Record<string | number | symbol, unknown>;

const initialState: CalibrationState = {
  calibrationProgress: 0,
  calibrationCountdown: null,
  isCalibrating: false,
  requiresCalibration: false,
  hasCalibratedThisSession: false,
};

function calibrationReducer(initialState: CalibrationState, action: Action) {
  switch (action.type) {
    case "START":
      return { ...initialState };
    default:
      return initialState;
  }
}

export default function useCalibration() {
  const [state, dispatch] = useReducer(calibrationReducer, initialState);
  dispatch({ type: "START" });
  //calibration state
  const [calibrationProgress, setProgress] = useState<number>(0);
  const [calibrationCountdown, setCalibrationCountdown] = useState<number | null>(null);
  const [isCalibrating, setCalibrating] = useState<boolean>(false);
  const [requiresCalibration, setRequiresCalibration] = useState<boolean>(false);
  const [hasCalibratedThisSession, setHasCalibratedThisSession] = useState<boolean>(false);
}
