// Minimal browser stub for "@langchain/core/messages" and related imports
export class BaseMessage {
  constructor(public text: string) {}
}
export class HumanMessage extends BaseMessage {}
export class SystemMessage extends BaseMessage {}
export class AIMessage extends BaseMessage {}

export default { BaseMessage, HumanMessage, SystemMessage, AIMessage };