import type { ValidKeypoints } from "../monitoring.types";


export abstract class Buffer {
  protected readonly MAX_SIZE;
  protected readonly _buffer: number[] = [];
  protected runningTotalPostureHeights: number = 0;

  constructor(maxSize: number = 30) {
    this.MAX_SIZE = maxSize;
  }

  abstract push(keypoints: ValidKeypoints): void;

}

export class SlidingWindowBuffer extends Buffer {
  push({ nose, lShoulder, rShoulder }: ValidKeypoints) {
    const framePostureheight = (lShoulder.y + rShoulder.y) / 2 - nose.y;
    const shoulderWidth = Math.hypot(
      rShoulder.x - lShoulder.x,
      rShoulder.y - lShoulder.y,
    );
    if(framePostureheight <= 0 || shoulderWidth === 0) return;
    const normalizedPostureHeight = framePostureheight / shoulderWidth;


    this._buffer.push(normalizedPostureHeight);
    this.runningTotalPostureHeights += normalizedPostureHeight;
    if (this._buffer.length > this.MAX_SIZE) {
      const removedFrame = this._buffer.shift()!;
      this.runningTotalPostureHeights -= removedFrame;
    }
  }

  get averagePostureHeight() {
    return this._buffer.length === 0 ? 0 : this.runningTotalPostureHeights / this._buffer.length;
  }
}

export class CalibrationBuffer extends Buffer {
  constructor(maxSize: number) {
    super(maxSize);
  }

  push({ nose, lShoulder, rShoulder }: ValidKeypoints) {
    if (this.isFull) {
      console.log("CALIBRATION BUFFER FULL!");
      return;
    }
    const postureHeight = (lShoulder.y + rShoulder.y) / 2 - nose.y;
    const shoulderWidth = Math.hypot(
      rShoulder.x - lShoulder.x,
      rShoulder.y - lShoulder.y,
    );
    if(postureHeight <= 0 || shoulderWidth === 0) return;
    const normalizedPostureHeight = postureHeight / shoulderWidth;

    this._buffer.push(normalizedPostureHeight);
    this.runningTotalPostureHeights += normalizedPostureHeight;
  }

  get isFull() {
    return this._buffer.length >= this.MAX_SIZE;
  }

  get progress() {
    return Math.round((this._buffer.length / this.MAX_SIZE) * 100);
  }

  get calibratedHeight(): number {
    return this.runningTotalPostureHeights / this._buffer.length;
  }
}
