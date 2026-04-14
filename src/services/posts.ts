import {
  createPostBody,
  updatePostBody,
} from "@paragraph-com/sdk";
import type { GetPostById200, GetPostsFeed200ItemsItem } from "@paragraph-com/sdk";
import { createClient } from "./client.js";
import { getPublication } from "./publications.js";

export interface PaginatedResult<T> {
  items: T[];
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
}): Promise<PaginatedResult<GetPostById200>> {
  const client = createClient(params.apiKey);

  if (params.publicationId) {
    // Resolve slug to ID if needed
    let pubId = params.publicationId;
    if (isSlug(pubId)) {
      const pub = await getPublication(pubId);
      pubId = pub.id;
    }
    const { items, pagination } = await client.posts.get(
      { publicationId: pubId },
      { limit: params.limit, cursor: params.cursor }
    );
    return { items, cursor: pagination.cursor };
  }

  const { items, pagination } = await client.posts.list({
    status: params.status as "published" | "draft" | undefined,
    limit: params.limit,
    cursor: params.cursor,
  });
  return { items, cursor: pagination.cursor };
}

export async function getPost(
  id: string,
  apiKey?: string
): Promise<GetPostById200> {
  const client = createClient(apiKey);
  return client.posts.get({ id }, { includeContent: true }).single();
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
): Promise<GetPostById200> {
  // URL
  const urlMatch = identifier.match(/^https?:\/\/[^/]+\/@([^/]+)\/([^/?#]+)/);
  if (urlMatch) {
    return getPostBySlugs(urlMatch[1], urlMatch[2], apiKey);
  }

  // @pub-slug/post-slug
  const slugMatch = identifier.match(/^@([^/]+)\/(.+)$/);
  if (slugMatch) {
    return getPostBySlugs(slugMatch[1], slugMatch[2], apiKey);
  }

  // Plain ID
  return getPost(identifier, apiKey);
}

/**
 * Like resolvePost, but also handles bare slugs (e.g. "my-post") by
 * looking up the authenticated user's publication first.
 */
export async function resolveOwnPost(
  idOrSlug: string,
  apiKey: string
): Promise<GetPostById200> {
  // If it doesn't look like a bare slug, use the standard resolver
  if (!isSlug(idOrSlug) || idOrSlug.includes("/") || idOrSlug.startsWith("http")) {
    return resolvePost(idOrSlug, apiKey);
  }

  // Try as an ID first (short IDs can match the slug regex)
  try {
    return await getPost(idOrSlug, apiKey);
  } catch {
    // Fall through to slug resolution
  }

  // Resolve via the authenticated user's publication
  const { validateApiKey } = await import("./auth.js");
  const pub = await validateApiKey(apiKey);
  const pubSlug = pub.slug;
  if (!pubSlug) {
    throw new Error(`Post not found: ${idOrSlug}`);
  }
  return getPostBySlugs(pubSlug, idOrSlug, apiKey);
}

export async function getPostBySlugs(
  publicationSlug: string,
  postSlug: string,
  apiKey?: string
): Promise<GetPostById200> {
  const client = createClient(apiKey);
  return client.posts
    .get({ publicationSlug, postSlug }, { includeContent: true })
    .single();
}

export async function getPostByPubIdAndSlug(
  publicationId: string,
  postSlug: string,
  apiKey?: string
): Promise<GetPostById200> {
  const client = createClient(apiKey);
  return client.posts
    .get({ publicationId, postSlug }, { includeContent: true })
    .single();
}

export async function getPostsByTag(
  tag: string,
  pagination?: { limit?: number; cursor?: string }
): Promise<PaginatedResult<GetPostById200>> {
  const client = createClient();
  const { items, pagination: pag } = await client.posts.get(
    { tag },
    { limit: pagination?.limit, cursor: pagination?.cursor }
  );
  return { items, cursor: pag.cursor };
}

export async function getFeed(pagination?: {
  limit?: number;
  cursor?: string;
}): Promise<PaginatedResult<GetPostsFeed200ItemsItem>> {
  const client = createClient();
  const { items, pagination: pag } = await client.feed.get({
    limit: pagination?.limit || 20,
    cursor: pagination?.cursor,
  });
  return { items, cursor: pag.cursor };
}

export async function createPost(params: {
  apiKey: string;
  title: string;
  markdown: string;
  subtitle?: string;
  tags?: string[];
  scheduledAt?: number;
  sendNewsletter?: boolean;
}) {
  const body = {
    title: params.title,
    markdown: params.markdown,
    status: (params.scheduledAt ? undefined : "draft") as "draft" | undefined,
    subtitle: params.subtitle,
    categories: params.tags,
    scheduledAt: params.scheduledAt,
    sendNewsletter: params.sendNewsletter,
  };
  createPostBody.parse(body);
  const client = createClient(params.apiKey);
  return client.posts.create(body);
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
  const body = {
    title: params.title,
    subtitle: params.subtitle,
    markdown: params.markdown,
    categories: params.tags,
  };
  updatePostBody.parse(body);
  const client = createClient(params.apiKey);

  // Try ID-first to avoid slug/ID ambiguity (short IDs like "abc123" match isSlug)
  try {
    await client.posts.update({ id: idOrSlug, ...body });
    return;
  } catch {
    if (!isSlug(idOrSlug)) throw new Error(`Post not found: ${idOrSlug}`);
  }
  await client.posts.update({ slug: idOrSlug, ...body });
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
  // Try ID-first to avoid slug/ID ambiguity
  try {
    await client.posts.delete({ id: idOrSlug });
    return;
  } catch {
    if (!isSlug(idOrSlug)) throw new Error(`Post not found: ${idOrSlug}`);
  }
  await client.posts.delete({ slug: idOrSlug });
}

export async function updatePostStatus(
  idOrSlug: string,
  status: "published" | "draft" | "archived",
  apiKey: string,
  sendNewsletter?: boolean
): Promise<void> {
  const client = createClient(apiKey);
  const body = { status, sendNewsletter: sendNewsletter || undefined };

  // Try ID-first to avoid slug/ID ambiguity
  try {
    await client.posts.update({ id: idOrSlug, ...body });
    return;
  } catch {
    if (!isSlug(idOrSlug)) throw new Error(`Post not found: ${idOrSlug}`);
  }
  await client.posts.update({ slug: idOrSlug, ...body });
}

export async function schedulePost(
  idOrSlug: string,
  scheduledAt: number,
  apiKey: string,
  sendNewsletter?: boolean
): Promise<void> {
  const client = createClient(apiKey);
  const body = {
    scheduledAt,
    sendNewsletter: sendNewsletter || undefined,
  };

  try {
    await client.posts.update({ id: idOrSlug, ...body });
    return;
  } catch {
    if (!isSlug(idOrSlug)) throw new Error(`Post not found: ${idOrSlug}`);
  }
  await client.posts.update({ slug: idOrSlug, ...body });
}

export async function cancelSchedule(
  idOrSlug: string,
  apiKey: string
): Promise<void> {
  const client = createClient(apiKey);
  const body = { scheduledAt: null };

  try {
    await client.posts.update({ id: idOrSlug, ...body });
    return;
  } catch {
    if (!isSlug(idOrSlug)) throw new Error(`Post not found: ${idOrSlug}`);
  }
  await client.posts.update({ slug: idOrSlug, ...body });
}
