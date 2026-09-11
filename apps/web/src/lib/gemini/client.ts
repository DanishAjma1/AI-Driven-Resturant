import { GoogleGenAI } from "@google/genai";
import { env } from "@/env";

let client: GoogleGenAI | null = null;

/** Returns `null` when no API key is configured — callers fall back to a local heuristic. */
export function getGeminiClient(): GoogleGenAI | null {
  if (!env.GOOGLE_GENAI_API_KEY) return null;
  if (!client) {
    client = new GoogleGenAI({ apiKey: env.GOOGLE_GENAI_API_KEY });
  }
  return client;
}

export const GEMINI_MODEL = "gemini-2.5-flash";
