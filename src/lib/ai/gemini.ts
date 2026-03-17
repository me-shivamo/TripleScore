import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import type { AIProvider, ChatMessage } from "./provider";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const MODEL = "gemini-1.5-flash";

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export const geminiProvider: AIProvider = {
  async streamChat(
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<ReadableStream<Uint8Array>> {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: systemPrompt,
      safetySettings,
    });

    // Convert messages to Gemini history format (all but last)
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const chat = model.startChat({ history });

    const result = await chat.sendMessageStream(lastMessage.content);

    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });
  },

  async parseStructured<T>(prompt: string): Promise<T> {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as T;
  },

  async generateText(prompt: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    return result.response.text();
  },
};
