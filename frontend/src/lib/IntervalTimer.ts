export class IntervalTimer {
  private id: number | null = null;

  start(callback: VoidFunction, intervalMs: number) {
    this.stop();
    const tick = () => {
      callback();
      this.id = setTimeout(tick, intervalMs);
    };
    tick();
  }
  stop() {
    if (this.id === null) return;
    clearTimeout(this.id);
    this.id = null;
  }
}

const timer = new IntervalTimer();
timer.start(() => console.log("Time!"), 1000);
