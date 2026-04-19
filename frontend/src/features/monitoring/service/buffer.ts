export abstract class Buffer {
  protected readonly MAX_SIZE: number = 30;
  protected readonly _buffer: number[] = [];
  protected runningTotal: number = 0;

  constructor(maxSize: number) {
    this.MAX_SIZE = maxSize;
  }

  abstract push(value: number): void;

  get isFull(): boolean {
    return this._buffer.length >= this.MAX_SIZE;
  }

  get average(): number {
    return this._buffer.length === 0 ? 0 : this.runningTotal / this._buffer.length;
  }

  flush() {
    this._buffer.length = 0;
    this.runningTotal = 0;
  }
}

export abstract class AggregateBuffer {}

export class SlidingWindowBuffer extends Buffer {
  // push({ nose, lShoulder, rShoulder }: ValidKeypoints) {
  // const framePostureheight = (lShoulder.y + rShoulder.y) / 2 - nose.y;
  // const shoulderWidth = Math.hypot(rShoulder.x - lShoulder.x, rShoulder.y - lShoulder.y);
  // if (framePostureheight <= 0 || shoulderWidth === 0) return;
  // const normalizedPostureHeight = framePostureheight / shoulderWidth;

  //   this._buffer.push(normalizedPostureHeight);
  //   this.runningTotalHeights += normalizedPostureHeight;
  //   if (this._buffer.length > this.MAX_SIZE) {
  //     const removedFrame = this._buffer.shift()!;
  //     this.runningTotalHeights -= removedFrame;
  //   }
  // }

  push(value: number) {
    // const framePostureheight = (lShoulder.y + rShoulder.y) / 2 - nose.y;
    // const shoulderWidth = Math.hypot(rShoulder.x - lShoulder.x, rShoulder.y - lShoulder.y);
    // if (framePostureheight <= 0 || shoulderWidth === 0) return;
    // const normalizedPostureHeight = framePostureheight / shoulderWidth;

    this._buffer.push(value);
    this.runningTotal += value;
    if (this._buffer.length > this.MAX_SIZE) {
      const removedValue = this._buffer.shift()!;
      this.runningTotal -= removedValue;
    }
  }
}

export class CalibrationBuffer extends Buffer {
  constructor(maxSize: number) {
    super(maxSize);
  }

  // push({ nose, lShoulder, rShoulder }: ValidKeypoints) {
  //   if (this.isFull) {
  //     console.log("CALIBRATION BUFFER FULL!");
  //     return;
  //   }
  //   const postureHeight = (lShoulder.y + rShoulder.y) / 2 - nose.y;
  //   const shoulderWidth = Math.hypot(rShoulder.x - lShoulder.x, rShoulder.y - lShoulder.y);
  //   if (postureHeight <= 0 || shoulderWidth === 0) return;
  //   const normalizedPostureHeight = postureHeight / shoulderWidth;

  //   this._buffer.push(normalizedPostureHeight);
  //   this.runningTotalPostureHeights += normalizedPostureHeight;
  // }

  push(value: number) {
    if (this.isFull) {
      return;
    }
    // const postureHeight = (lShoulder.y + rShoulder.y) / 2 - nose.y;
    // const shoulderWidth = Math.hypot(rShoulder.x - lShoulder.x, rShoulder.y - lShoulder.y);
    // if (postureHeight <= 0 || shoulderWidth === 0) return;
    // const normalizedPostureHeight = postureHeight / shoulderWidth;

    this._buffer.push(value);
    this.runningTotal += value;
  }

  get progress() {
    return Math.round((this._buffer.length / this.MAX_SIZE) * 100);
  }
}
