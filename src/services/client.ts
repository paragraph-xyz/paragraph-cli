import { ParagraphAPI } from "@paragraph-com/sdk";

export function createClient(apiKey?: string): ParagraphAPI {
  const options: Record<string, string> = {};
  if (apiKey) options.apiKey = apiKey;
  if (process.env.PARAGRAPH_API_URL) options.baseUrl = process.env.PARAGRAPH_API_URL;
  return new ParagraphAPI(Object.keys(options).length ? options : undefined);
}
