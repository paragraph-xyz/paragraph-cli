import { createClient } from "./client.js";

export async function getPublication(
  idOrSlug: string,
  apiKey?: string
): Promise<Record<string, unknown>> {
  const client = createClient(apiKey);

  try {
    return (await client.publications
      .get({ slug: idOrSlug })
      .single()) as Record<string, unknown>;
  } catch {
    return (await client.publications
      .get({ id: idOrSlug })
      .single()) as Record<string, unknown>;
  }
}

export async function getPublicationByDomain(
  domain: string
): Promise<Record<string, unknown>> {
  const client = createClient();
  return (await client.publications
    .get({ domain })
    .single()) as Record<string, unknown>;
}

/**
 * Smart resolver — accepts ID, slug, or domain (detected by presence of `.`).
 */
export async function resolvePublication(
  identifier: string,
  apiKey?: string
): Promise<Record<string, unknown>> {
  if (identifier.includes(".")) {
    return getPublicationByDomain(identifier);
  }
  return getPublication(identifier, apiKey);
}
