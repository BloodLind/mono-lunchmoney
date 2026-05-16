export type DelayFunction = (milliseconds: number) => Promise<void>;
export type NowFunction = () => number;

export class MonoRateLimiter {
  private lastRequestAt = 0;

  constructor(
    private readonly options: {
      minIntervalMs?: number;
      now?: NowFunction;
      delay?: DelayFunction;
    } = {}
  ) {}

  async waitTurn(): Promise<void> {
    const now = this.options.now ?? Date.now;
    const delay = this.options.delay ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
    const minIntervalMs = this.options.minIntervalMs ?? 60_000;
    const elapsed = now() - this.lastRequestAt;

    if (this.lastRequestAt !== 0 && elapsed < minIntervalMs) {
      await delay(minIntervalMs - elapsed);
    }

    this.lastRequestAt = now();
  }
}
