export class StreamController {
  private abortController: AbortController;
  private isPaused: boolean = false;
  private queue: any[] = [];

  constructor() {
    this.abortController = new AbortController();
  }

  get signal(): AbortSignal {
    return this.abortController.signal;
  }

  abort(): void {
    this.abortController.abort();
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    this.processQueue();
  }

  enqueue(data: any): void {
    if (this.isPaused) {
      this.queue.push(data);
    } else {
      this.processData(data);
    }
  }

  private processQueue(): void {
    while (!this.isPaused && this.queue.length > 0) {
      const data = this.queue.shift();
      this.processData(data);
    }
  }

  private processData(data: any): void {
    // Process data - could be extended with custom handlers
    console.log('Processing stream data:', data);
  }

  isAborted(): boolean {
    return this.abortController.signal.aborted;
  }

  clear(): void {
    this.queue = [];
  }
}