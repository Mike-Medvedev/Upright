export class ApplicationError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message, { cause });
    this.name = new.target.name;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConfigurationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message, "CONFIGURATION_ERROR", details, cause);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message, "VALIDATION_ERROR", details, cause);
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message, "AUTHENTICATION_ERROR", details, cause);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} not found.` : resource, "NOT_FOUND", id ? { resource, id } : undefined);
  }
}

export class LocalCameraError extends ApplicationError {
  constructor(message: string, cause?: unknown) {
    super(message, "LOCAL_CAMERA_ERROR", undefined, cause);
  }
}

export class InferenceError extends ApplicationError {
  constructor(code: INFERENCE_ERROR_CODES) {
    super(code, code);
  }
}

export const INFERENCE_ERROR_CODES = {
  MISSING_PREDICTION_IMAGE_DIMENSIONS: "MISSING_PREDICTION_IMAGE_DIMENSIONS",
  MISSING_KEYPOINTS: "MISSING_KEYPOINTS",
  MISSING_NOSE_KEYPOINT: "MISSING_NOSE_KEYPOINT",
  MISSING_RSHOULDER_KEYPOINT: "MISSING_RSHOULDER_KEYPOINT",
  MISSING_LSHOULDER_KEYPOINT: "MISSING_LSHOULDER_KEYPOINT",
  USER_OUT_OF_FRAME: "USER_OUT_OF_FRAME",
  USER_FRAME_TOO_SMALL: "USER_FRAME_TOO_SMALL",
  USER_FRAME_TOO_BIG: "USER_FRAME_TOO_BIG",
} as const;

export type INFERENCE_ERROR_CODES =
  (typeof INFERENCE_ERROR_CODES)[keyof typeof INFERENCE_ERROR_CODES];
