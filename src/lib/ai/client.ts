import type { AIProvider } from "./provider";
import { anthropicProvider } from "./anthropic";
import { geminiProvider } from "./gemini";
import { openrouterProvider } from "./openrouter";

/**
 * Returns the active AI provider.
 * Switch by setting AI_PROVIDER in .env:
 *   AI_PROVIDER=openrouter  (default — uses OpenRouter API)
 *   AI_PROVIDER=anthropic   (direct Anthropic SDK)
 *   AI_PROVIDER=gemini      (Google Gemini)
 */
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? "openrouter";

  switch (provider) {
    case "gemini":
      return geminiProvider;
    case "anthropic":
      return anthropicProvider;
    case "openrouter":
    default:
      return openrouterProvider;
  }
}
