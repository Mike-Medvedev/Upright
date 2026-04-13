import type { WebRTCOutputData } from "@roboflow/inference-sdk";

export interface Keypoint {
  class_id: number;
  class: string;
  confidence: number;
  x: number;
  y: number;
}

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

export type InferenceOutputData = Omit<WebRTCOutputData, "serialized_output_data"> & {
  serialized_output_data?: Frame | null;
};

export type Frame = {
  output?: {
    image?: {
      width?: number;
      height?: number;
    };
    predictions: Prediction[];
  };
};
