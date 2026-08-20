import { createContentBody, updateContentBody } from "@paragraph-com/sdk/zod";
import type {
  CreateContent200,
  GetContentById200,
  ListContent200ItemsItem,
  UpdateContent200,
} from "@paragraph-com/sdk";
import { createClient } from "./client.js";

export interface PaginatedResult<T> {
  items: T[];
  cursor?: string;
}

/** The kinds of drafted content a publication's library can hold. */
export type ContentKind = "tweet" | "linkedin" | "newsletter" | "x_article";

export const CONTENT_KINDS: ContentKind[] = [
  "tweet",
  "linkedin",
  "newsletter",
  "x_article",
];

/**
 * The artifact itself. Which fields a kind needs is decided server-side by the
 * same validator the Paragraph app goes through, so one mistake gets one
 * message whichever door made it.
 */
export interface ContentBody {
  text?: string;
  tweets?: string[];
  subject?: string;
  preheader?: string;
  body?: string;
  title?: string;
  canonicalUrl?: string;
}

export async function listContent(params: {
  apiKey: string;
  kind?: string;
  status?: string;
  limit?: number;
  cursor?: string;
}): Promise<PaginatedResult<ListContent200ItemsItem>> {
  const client = createClient(params.apiKey);
  const { items, pagination } = await client.content.list({
    kind: params.kind as ContentKind | undefined,
    status: params.status as
      | "all"
      | "draft"
      | "published"
      | "archived"
      | undefined,
    limit: params.limit,
    cursor: params.cursor,
  });
  return { items, cursor: pagination.cursor };
}

export async function getContent(
  id: string,
  apiKey: string
): Promise<GetContentById200> {
  const client = createClient(apiKey);
  return client.content.get({ id });
}

export async function createContent(params: {
  apiKey: string;
  kind: ContentKind;
  title: string;
  body: ContentBody;
}): Promise<CreateContent200> {
  const body = {
    kind: params.kind,
    title: params.title,
    body: params.body,
  };
  createContentBody.parse(body);
  const client = createClient(params.apiKey);
  return client.content.create(body);
}

export async function updateContent(
  id: string,
  params: { apiKey: string; title?: string; body?: ContentBody }
): Promise<UpdateContent200> {
  const body = {
    title: params.title,
    body: params.body,
  };
  updateContentBody.parse(body);
  const client = createClient(params.apiKey);
  return client.content.update({ id, ...body });
}

export async function archiveContent(
  id: string,
  apiKey: string
): Promise<void> {
  const client = createClient(apiKey);
  await client.content.archive({ id });
}

export async function restoreContent(
  id: string,
  apiKey: string
): Promise<void> {
  const client = createClient(apiKey);
  await client.content.restore({ id });
}
