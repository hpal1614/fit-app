// Browser stub for the Node-only "prom-client" package
// Exports minimal no-op versions of the classes/functions used in the codebase

/* eslint-disable @typescript-eslint/no-unused-vars */

export class Counter {
  constructor(_opts: any) {}
  inc(_labels?: any, _value?: number): void {}
  reset(): void {}
}

export class Histogram {
  constructor(_opts: any) {}
  observe(_labels?: any, _value?: number): void {}
  reset(): void {}
}

export class Gauge {
  constructor(_opts: any) {}
  inc(_labels?: any, _value?: number): void {}
  dec(_labels?: any, _value?: number): void {}
  set(_labels?: any, _value?: number): void {}
  reset(): void {}
}

export class Summary {
  constructor(_opts: any) {}
  observe(_labels?: any, _value?: number): void {}
  reset(): void {}
}

export const register = {
  registerMetric: (_metric: any) => {},
  metrics: () => '',
  clear: () => {}
};

export default { Counter, Histogram, Gauge, Summary, register };