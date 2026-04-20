import type {
  Frame,
  Keypoint,
  Prediction,
  ValidKeypoint,
  ValidKeypoints,
  ValidatedFrame,
} from "@/features/monitoring/monitoring.types";
import { InferenceError } from "@/lib/errors";
import type { WebRTCOutputData } from "@roboflow/inference-sdk";

export function parseMonitoringFrame(
  data: WebRTCOutputData,
): { validatedFrame: ValidatedFrame; error: null } | { validatedFrame: null; error: InferenceError } {
  const raw = data.serialized_output_data as Frame;
  const hasPredictions = raw?.output?.predictions?.length > 0;

  if (!hasPredictions || !raw.output.predictions[0].keypoints) {
    return { validatedFrame: null, error: new InferenceError("MISSING_KEYPOINTS") };
  }

  if (!raw.output.image?.width || !raw.output.image?.height) {
    return {
      validatedFrame: null,
      error: new InferenceError("MISSING_PREDICTION_IMAGE_DIMENSIONS"),
    };
  }

  if (raw.output.predictions.length > 1) {
    return { validatedFrame: null, error: new InferenceError("MULTIPLE_PERSONS_IN_FRAME") };
  }

  return { validatedFrame: raw as ValidatedFrame, error: null };
}

export function extractMonitoringKeypoints(
  keypoints: Keypoint[],
): { keypoints: ValidKeypoints; error: null } | { keypoints: null; error: InferenceError } {
  let nose: ValidKeypoint | null = null;
  let lShoulder: ValidKeypoint | null = null;
  let rShoulder: ValidKeypoint | null = null;
  let lEar: ValidKeypoint | undefined;
  let rEar: ValidKeypoint | undefined;

  for (const keypoint of keypoints) {
    if (keypoint.class === "nose") {
      nose = keypoint as ValidKeypoint;
    } else if (keypoint.class === "left_shoulder") {
      lShoulder = keypoint as ValidKeypoint;
    } else if (keypoint.class === "right_shoulder") {
      rShoulder = keypoint as ValidKeypoint;
    } else if (keypoint.class === "left_ear") {
      lEar = keypoint as ValidKeypoint;
    } else if (keypoint.class === "right_ear") {
      rEar = keypoint as ValidKeypoint;
    }
  }

  if (!nose) return { keypoints: null, error: new InferenceError("MISSING_NOSE_KEYPOINT") };
  if (!lShoulder) return { keypoints: null, error: new InferenceError("MISSING_LSHOULDER_KEYPOINT") };
  if (!rShoulder) return { keypoints: null, error: new InferenceError("MISSING_RSHOULDER_KEYPOINT") };

  return { keypoints: { nose, lShoulder, rShoulder, lEar, rEar }, error: null };
}

export function scaleMonitoringFrame(
  frame: ValidatedFrame,
  videoDimensions: { width: number; height: number },
): ValidatedFrame {
  const scaleX = videoDimensions.width / frame.output.image.width;
  const scaleY = videoDimensions.height / frame.output.image.height;

  const scaledPredictions = frame.output.predictions.map((prediction) => ({
    ...prediction,
    x: prediction.x == null ? prediction.x : prediction.x * scaleX,
    y: prediction.y == null ? prediction.y : prediction.y * scaleY,
    width: prediction.width == null ? prediction.width : prediction.width * scaleX,
    height: prediction.height == null ? prediction.height : prediction.height * scaleY,
    keypoints: prediction.keypoints!.map((keypoint) => ({
      ...keypoint,
      x: keypoint.x * scaleX,
      y: keypoint.y * scaleY,
    })),
  }));

  return {
    ...frame,
    output: {
      ...frame.output,
      predictions: scaledPredictions as Prediction[] & [{ keypoints: Keypoint[] }],
    },
  };
}
