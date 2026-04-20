/**
 * An abstract base class for managing a numeric data buffer with a running average.
 * This class acts as a Low-Pass Filter, smoothing out noisy data (like jittery
 * pose estimation keypoints) from video frames by maintaining a sliding window of values.
 *
 * @abstract
 */
export abstract class Buffer {
  /** The maximum capacity of the buffer. A larger size results in more stability but higher latency in detection. */
  protected readonly MAX_SIZE: number = 30;

  /** The internal array holding the buffered values. */
  protected readonly _buffer: number[] = [];

  /** The current sum of all values in the buffer, used for O(1) average calculation. */
  protected runningTotal: number = 0;

  /**
   * @param maxSize - The number of frames to retain for smoothing.
   */
  constructor(maxSize: number) {
    this.MAX_SIZE = maxSize;
  }

  /**
   * Adds a new value to the buffer.
   * @note Implementation must handle updating the `runningTotal` and maintaining `MAX_SIZE`.
   */
  abstract push(value: number): void;

  /** Checks if the buffer has reached its maximum configured capacity. */
  get isFull(): boolean {
    return this._buffer.length >= this.MAX_SIZE;
  }

  /**
   * Returns the mean of all currently buffered values.
   * Returns 0 if the buffer is empty.
   */
  get average(): number {
    return this._buffer.length === 0 ? 0 : this.runningTotal / this._buffer.length;
  }

  /**
   * Resets the buffer and the running total to their initial empty states.
   */
  flush() {
    this._buffer.length = 0;
    this.runningTotal = 0;
  }
}
/**
 * A specialized buffer that maintains a fixed-size "sliding window" of the most recent values.
 * As new values are added, the oldest values are evicted. This is ideal for
 * real-time smoothing of live data where you only care about the current
 * state rather than the entire history.
 * @example
 * // With MAX_SIZE 3:
 * [1, 2, 3] -> push(4) -> [2, 3, 4]
 */
export class SlidingWindowBuffer extends Buffer {
  /**
   * Adds a value to the window. If the buffer is at capacity, the oldest
   * value is removed to make room, keeping the `runningTotal` in sync.
   * * @param value - The numeric data point to include in the current window.
   */
  push(value: number) {
    this._buffer.push(value);
    this.runningTotal += value;
    if (this._buffer.length > this.MAX_SIZE) {
      const removedValue = this._buffer.shift()!;
      this.runningTotal -= removedValue;
    }
  }
}

/**
 * A specialized buffer used to capture a static baseline of data points.
 * * Unlike a sliding window, this buffer stops accepting new values once
 * `MAX_SIZE` is reached. It is designed to gather a specific "snapshot"
 * of data to calculate a stable average for calibration purposes.
 */
export class CalibrationBuffer extends Buffer {
  /**
   * @param maxSize - The total number of samples required to complete calibration.
   */
  constructor(maxSize: number) {
    super(maxSize);
  }

  /**
   * Adds a value to the calibration set.
   * Once `isFull` is true, subsequent calls are ignored.
   * * @param value - The numeric data point to contribute to the baseline.
   */
  push(value: number) {
    if (this.isFull) {
      return;
    }

    this._buffer.push(value);
    this.runningTotal += value;
  }

  /**
   * Calculates the current completion percentage of the calibration.
   * @returns An integer between 0 and 100.
   */
  get progress() {
    return Math.round((this._buffer.length / this.MAX_SIZE) * 100);
  }
}
