import { createClient } from "./client.js";
import { getPublication } from "./publications.js";

export interface PaginatedResult {
  items: Record<string, unknown>[];
  cursor?: string;
}

export function isSlug(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value);
}

export async function listPosts(params: {
  apiKey?: string;
  publicationId?: string;
  status?: string;
  limit?: number;
  cursor?: string;
}): Promise<PaginatedResult> {
  const client = createClient(params.apiKey);

  if (params.publicationId) {
    // Resolve slug to ID if needed
    let pubId = params.publicationId;
    if (isSlug(pubId)) {
      const pub = await getPublication(pubId);
      pubId = String(pub.id || pub._id || pubId);
    }
    const query: Record<string, unknown> = { publicationId: pubId };
    if (params.limit) query.limit = params.limit;
    if (params.cursor) query.cursor = params.cursor;
    const result = await client.posts.get(
      query as Parameters<typeof client.posts.get>[0]
    );
    const data = result as { items: Record<string, unknown>[]; pagination?: { cursor?: string } };
    return { items: data.items, cursor: data.pagination?.cursor };
  }

  const queryParams: Record<string, unknown> = {};
  if (params.status) queryParams.status = params.status;
  if (params.limit) queryParams.limit = params.limit;
  if (params.cursor) queryParams.cursor = params.cursor;
  const result = await client.posts.list(
    queryParams as Parameters<typeof client.posts.list>[0]
  );
  const data = result as { items: Record<string, unknown>[]; pagination?: { cursor?: string } };
  return { items: data.items, cursor: data.pagination?.cursor };
}

export async function getPost(
  id: string,
  apiKey?: string
): Promise<Record<string, unknown>> {
  const client = createClient(apiKey);
  const post = await client.posts
    .get({ id }, { includeContent: true })
    .single();
  return post as Record<string, unknown>;
}

/**
 * Smart post resolver — accepts:
 *   - URL:  https://paragraph.com/@pub-slug/post-slug
 *   - Slug pair: @pub-slug/post-slug
 *   - Post ID: anything else
 */
export async function resolvePost(
  identifier: string,
  apiKey?: string
): Promise<Record<string, unknown>> {
  // URL
  const urlMatch = identifier.match(/^https?:\/\/[^/]+\/@([^/]+)\/([^/?#]+)/);
  if (urlMatch) {
    return getPostBySlugs(urlMatch[1], urlMatch[2]);
  }

  // @pub-slug/post-slug
  const slugMatch = identifier.match(/^@([^/]+)\/(.+)$/);
  if (slugMatch) {
    return getPostBySlugs(slugMatch[1], slugMatch[2]);
  }

  // Plain ID
  return getPost(identifier, apiKey);
}

export async function getPostBySlugs(
  publicationSlug: string,
  postSlug: string
): Promise<Record<string, unknown>> {
  const client = createClient();
  const post = await client.posts
    .get({ publicationSlug, postSlug }, { includeContent: true })
    .single();
  return post as Record<string, unknown>;
}

export async function getPostByPubIdAndSlug(
  publicationId: string,
  postSlug: string
): Promise<Record<string, unknown>> {
  const client = createClient();
  const post = await client.posts
    .get({ publicationId, postSlug }, { includeContent: true })
    .single();
  return post as Record<string, unknown>;
}

export async function getPostsByTag(
  tag: string,
  pagination?: { limit?: number; cursor?: string }
): Promise<PaginatedResult> {
  const client = createClient();
  const query: Record<string, unknown> = { tag };
  if (pagination?.limit) query.limit = pagination.limit;
  if (pagination?.cursor) query.cursor = pagination.cursor;
  const result = await client.posts.get(
    query as Parameters<typeof client.posts.get>[0]
  );
  const data = result as { items: Record<string, unknown>[]; pagination?: { cursor?: string } };
  return { items: data.items, cursor: data.pagination?.cursor };
}

export async function getFeed(pagination?: {
  limit?: number;
  cursor?: string;
}): Promise<PaginatedResult> {
  const client = createClient();
  const query: Record<string, unknown> = { limit: pagination?.limit || 20 };
  if (pagination?.cursor) query.cursor = pagination.cursor;
  const result = await client.feed.get(
    query as Parameters<typeof client.feed.get>[0]
  );
  const data = result as { items: Record<string, unknown>[]; pagination?: { cursor?: string } };
  return { items: data.items, cursor: data.pagination?.cursor };
}

export async function createPost(params: {
  apiKey: string;
  title: string;
  markdown: string;
  subtitle?: string;
  tags?: string[];
}): Promise<Record<string, unknown>> {
  const client = createClient(params.apiKey);
  const body: Record<string, unknown> = {
    title: params.title,
    markdown: params.markdown,
  };
  if (params.subtitle) body.subtitle = params.subtitle;
  if (params.tags) body.categories = params.tags;

  const post = await client.posts.create(
    body as Parameters<typeof client.posts.create>[0]
  );
  return post as Record<string, unknown>;
}

export async function updatePost(
  idOrSlug: string,
  params: {
    apiKey: string;
    title?: string;
    markdown?: string;
    subtitle?: string;
    tags?: string[];
  }
): Promise<void> {
  const client = createClient(params.apiKey);
  const body: Record<string, unknown> = {};
  if (params.title) body.title = params.title;
  if (params.subtitle) body.subtitle = params.subtitle;
  if (params.markdown) body.markdown = params.markdown;
  if (params.tags) body.categories = params.tags;

  if (isSlug(idOrSlug)) {
    await client.posts.update({
      slug: idOrSlug,
      ...body,
    } as Parameters<typeof client.posts.update>[0]);
  } else {
    await client.posts.update({
      id: idOrSlug,
      ...body,
    } as Parameters<typeof client.posts.update>[0]);
  }
}

export async function sendTestEmail(
  postId: string,
  apiKey: string
): Promise<void> {
  const client = createClient(apiKey);
  await client.posts.sendTestEmail({ id: postId });
}

export async function deletePost(
  idOrSlug: string,
  apiKey: string
): Promise<void> {
  const client = createClient(apiKey);
  if (isSlug(idOrSlug)) {
    await client.posts.delete({ slug: idOrSlug });
  } else {
    await client.posts.delete({ id: idOrSlug });
  }
}

export async function updatePostStatus(
  idOrSlug: string,
  status: "published" | "draft" | "archived",
  apiKey: string,
  sendNewsletter?: boolean
): Promise<void> {
  const client = createClient(apiKey);
  const body: Record<string, unknown> = { status };
  if (sendNewsletter) body.sendNewsletter = true;

  if (isSlug(idOrSlug)) {
    await client.posts.update({
      slug: idOrSlug,
      ...body,
    } as Parameters<typeof client.posts.update>[0]);
  } else {
    await client.posts.update({
      id: idOrSlug,
      ...body,
    } as Parameters<typeof client.posts.update>[0]);
  }
}
