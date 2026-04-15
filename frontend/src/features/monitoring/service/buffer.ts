import type { ValidKeypoints } from "@/features/monitoring/monitoring.types";

export class Buffer {
  private readonly MAX_SIZE = 30;
  private readonly _buffer: number[] = [];
  private runningTotalPostureHeights: number = 0;

  push({ nose, lShoulder, rShoulder }: ValidKeypoints) {
    const framePostureheight = (lShoulder.y + rShoulder.y) / 2 - nose.y;
    if (framePostureheight === 0) return;

    this._buffer.push(framePostureheight);
    this.runningTotalPostureHeights += framePostureheight;
    if (this._buffer.length > this.MAX_SIZE) {
      const removedFrame = this._buffer.shift()!;
      this.runningTotalPostureHeights -= removedFrame;
    }
  }

  get averagePostureHeight() {
    return this._buffer.length === 0 ? 0 : this.runningTotalPostureHeights / this._buffer.length;
  }
}
