import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API client
// We use a getter function to ensure we always get the latest API key if it changes
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. API calls will fail.');
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
}
