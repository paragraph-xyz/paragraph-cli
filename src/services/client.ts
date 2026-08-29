import { ParagraphAPI } from "@paragraph-com/sdk";

export function createClient(apiKey?: string): ParagraphAPI {
  return new ParagraphAPI({
    ...(apiKey ? { apiKey } : {}),
    ...(process.env.PARAGRAPH_API_URL
      ? { baseURL: process.env.PARAGRAPH_API_URL }
      : {}),
  });
}
