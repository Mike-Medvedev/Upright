import { calibrationSnapshotSchema, type CalibrationSnapshot } from "../monitoring.types";

/**
 * Calibration persistence policy (see product plan):
 * - Store a snapshot after the user completes the calibration wizard.
 * - On a new monitoring session, skip the wizard if the snapshot is younger than
 *   {@link CALIBRATION_MAX_AGE_MS} and (when present) input video dimensions match the stored
 *   width/height (camera or resolution change → re-calibrate).
 * - User can always open Recalibrate from the monitoring card.
 */
export const CALIBRATION_STORAGE_KEY = "upright_calibration_v1";

/** Skip calibration wizard if we have a recent snapshot and dimensions still match (when provided). */
export const CALIBRATION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function loadCalibrationSnapshot(): CalibrationSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CALIBRATION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    const result = calibrationSnapshotSchema.safeParse(parsed);

    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function saveCalibrationSnapshot(snapshot: CalibrationSnapshot): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(snapshot));
}

export function shouldSkipCalibrationWizard(
  snapshot: CalibrationSnapshot | null,
  videoDimensions: { width: number; height: number },
): boolean {
  if (!snapshot) {
    return false;
  }

  const calibratedAt = Date.parse(snapshot.calibratedAt);
  if (Number.isNaN(calibratedAt) || Date.now() - calibratedAt > CALIBRATION_MAX_AGE_MS) {
    return false;
  }

  if (
    snapshot.videoWidth !== undefined &&
    snapshot.videoHeight !== undefined &&
    (snapshot.videoWidth !== videoDimensions.width || snapshot.videoHeight !== videoDimensions.height)
  ) {
    return false;
  }

  return true;
}
