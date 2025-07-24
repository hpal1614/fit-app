export class BaseLanguageModel {
  async generate(_prompt: string): Promise<string> {
    return '';
  }
}