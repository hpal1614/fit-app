export class BaseMessage { constructor(public text: string) {} }
export class HumanMessage extends BaseMessage {}
export class SystemMessage extends BaseMessage {}
export class AIMessage extends BaseMessage {}