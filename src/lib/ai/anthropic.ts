import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, ChatMessage } from "./provider";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";

export const anthropicProvider: AIProvider = {
  async streamChat(
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<ReadableStream<Uint8Array>> {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      },
      cancel() {
        stream.abort();
      },
    });
  },

  async parseStructured<T>(prompt: string): Promise<T> {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
      system:
        "You are a JSON extraction assistant. Respond ONLY with valid JSON, no explanation, no markdown fences.",
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return JSON.parse(text) as T;
  },

  async generateText(prompt: string): Promise<string> {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    return response.content[0].type === "text" ? response.content[0].text : "";
  },
};
