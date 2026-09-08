export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AICapabilities {
  /** False means the UI hides every live-model affordance rather than
   *  offering something that will fail. */
  available: boolean;
  label: string;
}

/**
 * Optional enrichment only.
 *
 * Every lesson and every grade works with the null provider. A live model adds
 * "try your prompt for real" on top of a course that is already complete —
 * which keeps the app free, offline-capable, and safe by default.
 */
export interface IAIProvider {
  capabilities(): AICapabilities;
  complete(messages: AIMessage[], signal?: AbortSignal): Promise<string>;
}
