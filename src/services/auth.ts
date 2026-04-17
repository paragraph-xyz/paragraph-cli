import { readConfig } from "./config.js";
import { createClient } from "./client.js";

export function getApiKey(flagToken?: string): string | undefined {
  if (flagToken) return flagToken;
  if (process.env.PARAGRAPH_API_KEY) return process.env.PARAGRAPH_API_KEY;
  const config = readConfig();
  return config.apiKey;
}

export function requireApiKey(flagToken?: string): string {
  const key = getApiKey(flagToken);
  if (!key) {
    throw new Error(
      "No API key found. Run `paragraph login` or set PARAGRAPH_API_KEY."
    );
  }
  return key;
}

export async function validateApiKey(
  token: string
): Promise<{ id?: string; name?: string; slug?: string; customDomain?: string }> {
  const client = createClient(token);
  const me = (await client.me.get()) as Record<string, unknown>;
  return {
    id: me.id as string | undefined,
    name: me.name as string | undefined,
    slug: me.slug as string | undefined,
    customDomain: me.customDomain as string | undefined,
  };
}

export async function whoami(apiKey: string) {
  return validateApiKey(apiKey);
}
