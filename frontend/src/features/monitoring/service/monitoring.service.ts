import type { Frame, Keypoint } from "@/features/monitoring/monitoring.types";

export class Buffer {
  private readonly MAX_SIZE = 30;
  private readonly _buffer: number[] = [];
  private runningTotalPostureHeights: number = 0;

  push(keypoints: Keypoint[]) {
    const frameheight = this.calculateSingleFramesAveragePostureHeight(keypoints);
    if (frameheight === 0) return;

    this._buffer.push(frameheight);
    this.runningTotalPostureHeights += frameheight;
    if (this._buffer.length > this.MAX_SIZE) {
      const removedFrame = this._buffer.shift()!;
      this.runningTotalPostureHeights -= removedFrame;
    }
  }

  private calculateSingleFramesAveragePostureHeight(keypoints: Keypoint[]): number {
    let nose, lShoulder, rShoulder;
    for (const k of keypoints) {
      if (k.class === "nose") nose = k;
      else if (k.class === "left_shoulder") lShoulder = k;
      else if (k.class === "right_shoulder") rShoulder = k;
    }
    if (nose && lShoulder && rShoulder) {
      return (lShoulder.y + rShoulder.y) / 2 - nose.y;
    } else {
      console.warn("Missing nose or shoulder keypoints");
      return 0;
    }
  }

  get averagePostureHeight() {
    return this._buffer.length === 0 ? 0 : this.runningTotalPostureHeights / this._buffer.length;
  }
}

export class MonitoringService {
  private readonly buffer: Buffer;
  private skippedKeypointCount: number = 0;
  private calibratedHeight: number = 1 * 0.8;
  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  validatePosture(frame: Frame) {
    const keypoints = frame?.output?.predictions?.[0].keypoints;
    if (!keypoints) {
      this.skippedKeypointCount += 1;
      return;
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
