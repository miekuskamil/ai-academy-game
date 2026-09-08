import type { AICapabilities, AIMessage, IAIProvider } from './IAIProvider';

/** The default. Live model features are off until a parent turns them on. */
export class NullProvider implements IAIProvider {
  capabilities(): AICapabilities {
    return { available: false, label: 'Live model off' };
  }

  async complete(_messages: AIMessage[]): Promise<string> {
    throw new Error('No live model is connected.');
  }
}
