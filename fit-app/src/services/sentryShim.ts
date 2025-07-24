// Lightweight shim for @sentry/react when the real SDK is not desired in the browser bundle.
// Provides no-op implementations of the handful of APIs referenced by the codebase.
export class BrowserTracing {}
export class Replay {
  constructor(_opts: any = {}) {}
}

export function init(_config: any = {}): void {}
export function startTransaction(_opts: any = {}): any { return { end: () => {} }; }
export function getCurrentHub(): any { return null; }

// Stub for AsyncLocalStorage used by langgraph when bundled for browser
export class AsyncLocalStorage<T = unknown> {
  getStore(): T | undefined { return undefined; }
  run<R, TCallback extends (...args: any[]) => R>(_store: T, callback: TCallback, ...args: Parameters<TCallback>): R {
    return callback(...args);
  }
  exit<R, TCallback extends (...args: any[]) => R>(callback: TCallback, ...args: Parameters<TCallback>): R {
    return callback(...args);
  }
  enterWith(_store: T): void {}
}

// Export everything in a single object to support `import * as Sentry` patterns
const SentryShim = {
  BrowserTracing,
  Replay,
  init,
  startTransaction,
  getCurrentHub,
  captureException,
  addBreadcrumb,
  close
};

export function captureException(_err: any): void {}
export function addBreadcrumb(_breadcrumb: any): void {}
export function close(_timeout?: number): Promise<boolean> { return Promise.resolve(true); }

export default SentryShim;