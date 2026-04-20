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
  push(value: number) {
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

  push(value: number) {
    if (this.isFull) {
      return;
    }

    this._buffer.push(value);
    this.runningTotal += value;
  }

  get progress() {
    return Math.round((this._buffer.length / this.MAX_SIZE) * 100);
  }
}
