import type { Frame } from "@/features/monitoring/monitoring.types";
import { Buffer } from "./buffer";

export class MonitoringService {
  private readonly buffer: Buffer;
  private missingKeyPoints: number = 0;
  private calibratedHeight: number = 150 * 0.8;
  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  validatePosture(frame: Frame) {
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
}

const buffer = new Buffer();

export const monitoringService = new MonitoringService(buffer);
