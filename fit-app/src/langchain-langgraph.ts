export const END = Symbol('END');
export class StateGraph {
  constructor() {}
  addNode() { return this; }
  addEdge() { return this; }
  addConditionalEdges() { return this; }
  compile() { 
    return {
      invoke: async () => ({ 
        messages: [], 
        currentResponse: 'I can help you with your fitness journey!' 
      })
    };
  }
}
export default { StateGraph, END };