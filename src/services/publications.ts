import { updatePublicationBody } from "@paragraph-com/sdk/zod";
import type {
  GetPublicationById200,
  UpdatePublication200,
  UpdatePublicationBody,
} from "@paragraph-com/sdk";
import { createClient } from "./client.js";

export async function getPublication(
  idOrSlug: string,
  apiKey?: string
): Promise<GetPublicationById200> {
  const client = createClient(apiKey);

  try {
    return await client.publications.get({ slug: idOrSlug }).single();
  } catch {
    return await client.publications.get({ id: idOrSlug }).single();
  }
}

export async function getPublicationByDomain(
  domain: string
): Promise<GetPublicationById200> {
  const client = createClient();
  return client.publications.get({ domain }).single();
}

/**
 * Smart resolver — accepts ID, slug, or domain (detected by presence of `.`).
 */
export async function resolvePublication(
  identifier: string,
  apiKey?: string
): Promise<GetPublicationById200> {
  if (identifier.includes(".")) {
    return getPublicationByDomain(identifier);
  }
  return getPublication(identifier, apiKey);
}

export async function updatePublication(
  publicationId: string,
  body: UpdatePublicationBody,
  apiKey: string
): Promise<UpdatePublication200> {
  updatePublicationBody.parse(body);
  const client = createClient(apiKey);
  return client.publications.update(publicationId, body);
}
