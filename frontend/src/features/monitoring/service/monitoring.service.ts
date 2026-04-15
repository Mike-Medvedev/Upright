import type {
  Frame,
  InferenceOutputData,
  Keypoint,
  Prediction,
} from "@/features/monitoring/monitoring.types";
import { Buffer } from "./buffer";
import type { Point } from "./canvas.service";

interface ValidationData {
  isHealthyPosture: boolean;
  shoulderPoints: { leftShoulderKeypoint: Point; rightShoulderKeypoint: Point };
}

//Todo: Ensure theres only one person in frame
export class MonitoringService {
  private readonly buffer: Buffer;
  private missingKeyPoints: number = 0;
  private calibratedHeight: number = 150 * 0.8;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  parseFrame(data: InferenceOutputData): Frame | null {
    const raw = data.serialized_output_data;
    if (!raw?.output?.predictions) return null;
    return raw as Frame;
  }

  process(data: InferenceOutputData): ValidationData {
    console.log(data);

    const scaledData = this.scaleCoords(data);

    const frame = scaledData.serialized_output_data;
    if (!scaledData.serialized_output_data?.output?.predictions[0].keypoints || !frame) return; //skip if model did not make predictions for this frame. THis should be used for validating if user is in frame though
    const isHealthyPosture = monitoringService.validatePosture(frame);

    if (!canvasRef.current || !canvasServiceRef.current) return;
    const keypoints = scaledData.serialized_output_data.output.predictions[0].keypoints;

    const { noseKeypoint, leftShoulderKeypoint, rightShoulderKeypoint } =
      this.extractKeypoints(keypoints);
    if (!noseKeypoint || !leftShoulderKeypoint || !rightShoulderKeypoint) {
      console.warn("One or more keypoints not in view");
      return null;
    }
    return { isHealthyPosture, shoulderPoints: { leftShoulderKeypoint, rightShoulderKeypoint } };
    // reset();
    // drawPostureStatus(isHealthyPosture);
    // drawKeypoints(scaledData.serialized_output_data.output.predictions[0].keypoints);
  }

  private extractKeypoints(keypoints: Keypoint[]) {
    let noseKeypoint, leftShoulderKeypoint, rightShoulderKeypoint;
    for (const k of keypoints) {
      if (k.class === "nose") {
        noseKeypoint = k;
      } else if (k.class === "left_shoulder") {
        leftShoulderKeypoint = k;
      } else if (k.class === "right_shoulder") {
        rightShoulderKeypoint = k;
      }
    }

    return { noseKeypoint, leftShoulderKeypoint, rightShoulderKeypoint };
  }

  private validatePosture(frame: Frame) {
    const keypoints = frame?.output?.predictions?.[0].keypoints;
    if (!keypoints) {
      this.missingKeyPoints += 1;
      return false;
    }
    this.buffer.push(keypoints);
    return this.buffer.averagePostureHeight > this.calibratedHeight;
  }

  set calibrate(calibratedHeight: number) {
    this.calibratedHeight = calibratedHeight;
  }
  get calibrate() {
    return this.calibratedHeight;
  }

  private scaleCoords(data: InferenceOutputData): InferenceOutputData {
    const scaleX = videoRef.current.videoWidth / data.serialized_output_data.output.image.width;
    const scaleY =
      videoRef.current.videoHeight / data.serialized_output_data?.output?.image?.height;
    const scaledPredictions = data.serialized_output_data?.output?.predictions.map((prediction) => {
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
      ...data,
      serialized_output_data: {
        ...data.serialized_output_data,
        output: {
          ...data.serialized_output_data.output,
          predictions: scaledPredictions,
        },
      },
    };
  }
}

const buffer = new Buffer();

export const monitoringService = new MonitoringService(buffer);
