import OpenAI from "openai";
import type { AIProvider, ChatMessage } from "./provider";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
    "X-Title": "TripleScore",
  },
});

// Model to use via OpenRouter — Gemini 2.0 Flash (fast & cheap)
const MODEL = "google/gemini-2.0-flash-001";

export const openrouterProvider: AIProvider = {
  async streamChat(
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<ReadableStream<Uint8Array>> {
    const stream = await client.chat.completions.create({
      model: MODEL,
      stream: true,
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
      cancel() {
        stream.controller.abort();
      },
    });
  },

  async parseStructured<T>(prompt: string): Promise<T> {
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content:
            "You are a JSON extraction assistant. Respond ONLY with valid JSON, no explanation, no markdown fences.",
        },
        { role: "user", content: prompt },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(text) as T;
  },

  async generateText(prompt: string): Promise<string> {
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0]?.message?.content ?? "";
  },
};
