import type { AICapabilities, AIMessage, IAIProvider } from './IAIProvider';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
}

/**
 * Talks to an Ollama server on the local network. Chosen over a hosted API for
 * the home setup: no key on the device, no per-token cost, and nothing a child
 * types leaves the house.
 *
 * Unavailable inside a Capacitor build on a phone, which cannot reach a
 * developer machine's localhost — the container falls back to NullProvider
 * there rather than failing at call time.
 */
export class OllamaProvider implements IAIProvider {
  constructor(private readonly config: OllamaConfig) {}

  capabilities(): AICapabilities {
    return { available: true, label: `Ollama · ${this.config.model}` };
  }

  async complete(messages: AIMessage[], signal?: AbortSignal): Promise<string> {
    const response = await fetch(`${this.config.baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.config.model, messages, stream: false }),
      ...(signal ? { signal } : {}),
    });
    if (!response.ok) {
      throw new Error(`Ollama replied ${response.status}. Is the server running?`);
    }
    const data: unknown = await response.json();
    const content = (data as { message?: { content?: string } }).message?.content;
    if (typeof content !== 'string') throw new Error('Ollama sent back an unexpected shape.');
    return content;
  }
}
