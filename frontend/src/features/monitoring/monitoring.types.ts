import { z } from "zod/v4";

export interface Keypoint {
  class_id: number;
  class: string;
  confidence: number;
  x: number;
  y: number;
}

export interface ValidationData {
  isHealthyPosture: boolean;
  frameDistanceStatus: "within_bounds" | "too_close" | "too_far";
  keypoints: ValidKeypoints;
}

export type MonitoringSessionStatus =
  | "idle"
  | "connecting"
  | "needs_calibration"
  | "calibration_countdown"
  | "live"
  | "calibrating"
  | "error";

export interface MonitoringUiState {
  isCameraActive: boolean;
  status: MonitoringSessionStatus;
  calibrationProgress: number;
  errorMessage: string | null;
}

export const monitoringAlertPreferencesSchema = z.object({
  desktopNotificationsEnabled: z.boolean(),
  soundEnabled: z.boolean(),
});

export type MonitoringAlertPreferences = z.infer<typeof monitoringAlertPreferencesSchema>;

export type BrowserNotificationPermissionState = NotificationPermission | "unsupported";

export const defaultMonitoringAlertPreferences: MonitoringAlertPreferences = {
  desktopNotificationsEnabled: true,
  soundEnabled: true,
};

export interface MonitoringContextValue {
  state: MonitoringUiState;
  alertPreferences: MonitoringAlertPreferences;
  startCamera: () => void;
  stopCamera: () => void;
  syncState: (nextState: Partial<MonitoringUiState>) => void;
  updateAlertPreferences: (nextState: Partial<MonitoringAlertPreferences>) => void;
  reset: () => void;
}

export type ValidKeypoint = Keypoint & {
  class: "nose" | "left_shoulder" | "right_shoulder" | "left_ear" | "right_ear";
};

export type ValidKeypoints = {
  nose: ValidKeypoint;
  lShoulder: ValidKeypoint;
  rShoulder: ValidKeypoint;
  lEar?: ValidKeypoint;
  rEar?: ValidKeypoint;
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
