export class ChatOpenAI {
  constructor(_opts: any = {}) {}
  async call(_messages: any[]): Promise<string> { return ''; }
}

export class OpenAIEmbeddings {
  constructor(_opts: any = {}) {}
  async embedQuery(_q: string): Promise<number[]> { return []; }
}

export default { ChatOpenAI, OpenAIEmbeddings };