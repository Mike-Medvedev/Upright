import type {
  Frame,
  Keypoint,
  Prediction,
  ValidatedFrame,
  ValidationData,
  ValidKeypoint,
  ValidKeypoints,
} from "@/features/monitoring/monitoring.types";
import { Buffer } from "./buffer";
import type { WebRTCOutputData } from "@roboflow/inference-sdk";
import { InferenceError } from "@/lib/errors";

//Todo: Ensure theres only one person in frame
export class MonitoringService {
  private readonly buffer: Buffer;
  private videoDimensions: { width: number; height: number } = { width: 0, height: 0 };
  private calibratedHeight: number = 150 * 0.8;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  parseFrame(
    data: WebRTCOutputData,
  ): { frame: ValidatedFrame; error: null } | { frame: null; error: InferenceError } {
    const raw = data.serialized_output_data as Frame;

    // Verify the structural hierarchy exists
    const hasPredictions = raw?.output?.predictions?.length > 0;

    // Specifically check if the first prediction has the keypoints array
    if (!hasPredictions || !raw.output.predictions[0].keypoints) {
      return { frame: null, error: new InferenceError("MISSING_KEYPOINTS") };
    }

    if (!raw.output.image?.width || !raw.output.image?.height) {
      return { frame: null, error: new InferenceError("MISSING_PREDICTION_IMAGE_DIMENSIONS") };
    }

    return { frame: raw as ValidatedFrame, error: null };
  }

  setDimensions(dimensions: { width: number; height: number }) {
    this.videoDimensions = dimensions;
  }
  process(frame: ValidatedFrame): ValidationData {
    console.log(frame);

    const scaledFrame = this.scaleFrame(frame);
    const keypoints = scaledFrame.output.predictions[0].keypoints;
    const { nose, lShoulder, rShoulder } = this.extractKeypoints(keypoints);

    const isHealthyPosture = this.validatePosture({ nose, lShoulder, rShoulder });

    return {
      isHealthyPosture,
      keypoints: {
        nose,
        lShoulder,
        rShoulder,
      },
    };
  }

  private extractKeypoints(keypoints: Keypoint[]): ValidKeypoints {
    let nose: ValidKeypoint | null = null;
    let lShoulder: ValidKeypoint | null = null;
    let rShoulder: ValidKeypoint | null = null;
    for (const k of keypoints) {
      if (k.class === "nose") {
        nose = k as ValidKeypoint;
      } else if (k.class === "left_shoulder") {
        lShoulder = k as ValidKeypoint;
      } else if (k.class === "right_shoulder") {
        rShoulder = k as ValidKeypoint;
      }
    }
    if (!nose) throw new InferenceError("MISSING_NOSE_KEYPOINT");
    if (!lShoulder) throw new InferenceError("MISSING_LSHOULDER_KEYPOINT");
    if (!rShoulder) throw new InferenceError("MISSING_RSHOULDER_KEYPOINT");
    return { nose, lShoulder, rShoulder };
  }

  private validatePosture(keypoints: ValidKeypoints) {
    this.buffer.push(keypoints);
    return this.buffer.averagePostureHeight > this.calibratedHeight;
  }

  set calibrate(calibratedHeight: number) {
    this.calibratedHeight = calibratedHeight;
  }
  get calibrate() {
    return this.calibratedHeight;
  }

  private scaleFrame(frame: ValidatedFrame): ValidatedFrame {
    const scaleX = this.videoDimensions.width / frame.output.image.width;
    const scaleY = this.videoDimensions.height / frame.output.image.height;

    const scaledPredictions = frame.output.predictions.map((prediction) => {
      return {
        ...prediction,
        x: prediction.x! * scaleX,
        y: prediction.y! * scaleY,
        keypoints: prediction.keypoints!.map((k) => ({
          ...k,
          x: k.x * scaleX,
          y: k.y * scaleY,
        })),
      };
    });
    return {
      ...frame,
      output: {
        ...frame.output,
        predictions: scaledPredictions as Prediction[] & [{ keypoints: Keypoint[] }],
      },
    };
  }
}

const buffer = new Buffer();

export const monitoringService = new MonitoringService(buffer);
