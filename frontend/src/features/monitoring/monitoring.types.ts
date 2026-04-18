export interface Keypoint {
  class_id: number;
  class: string;
  confidence: number;
  x: number;
  y: number;
}

export interface ValidationData {
  isHealthyPosture: boolean;
  keypoints: ValidKeypoints;
}

export type MonitoringSessionStatus = "idle" | "connecting" | "live" | "calibrating" | "error";

export interface MonitoringUiState {
  isCameraActive: boolean;
  status: MonitoringSessionStatus;
  calibrationProgress: number;
  errorMessage: string | null;
}

export interface MonitoringContextValue {
  state: MonitoringUiState;
  startCamera: () => void;
  stopCamera: () => void;
  syncState: (nextState: Partial<MonitoringUiState>) => void;
  reset: () => void;
}

export type ValidKeypoint = Keypoint & {
  class: "nose" | "left_shoulder" | "right_shoulder";
};

export type ValidKeypoints = {
  nose: ValidKeypoint;
  lShoulder: ValidKeypoint;
  rShoulder: ValidKeypoint;
};

export interface Prediction {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  confidence?: number;
  class_id?: number;
  class?: string;
  detection_id?: string;
  parent_id?: string;
  keypoints?: Keypoint[];
}

export type Frame = {
  output: {
    image: {
      width: number;
      height: number;
    };
    predictions: Prediction[];
  };
};

export type ValidatedFrame = Frame & {
  output: {
    predictions: [{ keypoints: Keypoint[] }];
  };
};
