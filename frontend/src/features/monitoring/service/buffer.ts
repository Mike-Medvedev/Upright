import type { Keypoint } from "@/features/monitoring/monitoring.types";

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
