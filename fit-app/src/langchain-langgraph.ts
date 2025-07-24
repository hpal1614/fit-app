export const END = Symbol('END');
export class StateGraph {
  constructor() {}
  addNode() { return this; }
  addEdge() { return this; }
  compile() { return () => {}; }
}
export default { StateGraph, END };