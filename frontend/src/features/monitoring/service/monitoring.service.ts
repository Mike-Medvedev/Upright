import type { WebRTCOutputData } from "@roboflow/inference-sdk";

export function Buffer() {
  const MAX_SIZE = 30;
  const _buffer: WebRTCOutputData["serialized_output_data"][] = [];

  function calculatePostureHeight(data: WebRTCOutputData["serialized_output_data"]) {
    if (!data.predictions || data.predictions.length === 0) return;
    const keypoints = data.predictions[0].keypoints;
    const noseY = keypoints.find((k) => k.class === "nose").y;
    const leftShoulderY = keypoints.find((k) => k.class === "left_shoulder").y;
    const rightShoulderY = keypoints.find((k) => k.class === "right_shoulder").y;
    const shoulderAvg = (leftShoulderY + rightShoulderY) / 2;
    return shoulderAvg - noseY;
  }
  return {
    push(data: WebRTCOutputData["serialized_output_data"]) {
      _buffer.push(data);

      if (_buffer.length > MAX_SIZE) {
        _buffer.shift();
      }
    },
    averagePostureHeight() {
      return _buffer.reduce((acc, curr) => acc + calculatePostureHeight(curr), 0) / _buffer.length;
    },
  };
}

export function InferencePipeline() {
  const buffer = Buffer();
  const calibratedPostureBaseline = 150;
  return {
    process(data: WebRTCOutputData) {
      buffer.push(data.serialized_output_data);
      const calulcatedAvg = buffer.averagePostureHeight();
      return validatePosture(calulcatedAvg, calibratedPostureBaseline);
    },
  };
}
/** Validates whether the user is an appropriate distance from the camera */
function validateUserDistance() {}

/** Validates whether the users upper body is detectible by object detection model */
function validateUserInFrame() {}

/** Begins determining users baseline vertical height between nose and shoulder */
function startCalibration() {}

/** Determines whether a user has good posture or is slouching*/
function validatePosture(calculatedAverage: number, baseline: number) {
  return calculatedAverage > baseline;
}

const x = {
  output: {
    image: {
      width: 960,
      height: 540,
    },
    predictions: [
      {
        width: 592,
        height: 329,
        x: 476,
        y: 370.5,
        confidence: 0.8408203125,
        class_id: 0,
        class: "person",
        detection_id: "ca178e26-9c4a-49e9-aa67-a8a615e093c5",
        parent_id: "image.[0]",
        keypoints: [
          {
            class_id: 0,
            class: "nose",
            confidence: 0.9990234375,
            x: 478,
            y: 344,
          },
          {
            class_id: 1,
            class: "left_eye",
            confidence: 0.99853515625,
            x: 520,
            y: 316,
          },
          {
            class_id: 2,
            class: "right_eye",
            confidence: 0.994140625,
            x: 450,
            y: 318,
          },
          {
            class_id: 3,
            class: "left_ear",
            confidence: 0.98583984375,
            x: 584,
            y: 348,
          },
          {
            class_id: 4,
            class: "right_ear",
            confidence: 0.49267578125,
            x: 415,
            y: 349,
          },
          {
            class_id: 5,
            class: "left_shoulder",
            confidence: 0.88671875,
            x: 671,
            y: 502,
          },
          {
            class_id: 6,
            class: "right_shoulder",
            confidence: 0.97021484375,
            x: 334,
            y: 497,
          },
        ],
      },
    ],
  },
};
