export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIProvider {
  /**
   * Stream a chat response. Returns a ReadableStream of text chunks.
   */
  streamChat(
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<ReadableStream<Uint8Array>>;

  /**
   * Generate a structured JSON response (no streaming).
   * Used for onboarding parsing and mock analysis.
   */
  parseStructured<T>(prompt: string): Promise<T>;

  /**
   * Generate a plain text response (no streaming).
   */
  generateText(prompt: string): Promise<string>;
}
