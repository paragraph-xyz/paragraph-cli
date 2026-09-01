import type {
  CreatePostContentBucket200,
  GetContentBucketById200,
  GetPostContentBucket200,
  ListContentBuckets200ItemsItem,
} from "@paragraph-com/sdk";
import { createClient } from "./client.js";
import type { PaginatedResult } from "./content.js";

/**
 * Content groups — one identity for a post and everything made out of it.
 *
 * Seed a group from the post, then pass its id as `bucketId` on the content
 * derived from it. Taking a piece back out of a group is done in the app.
 */

export async function listBuckets(params: {
  apiKey: string;
  limit?: number;
  cursor?: string;
}): Promise<PaginatedResult<ListContentBuckets200ItemsItem>> {
  const client = createClient(params.apiKey);
  const { items, pagination } = await client.buckets.list({
    limit: params.limit,
    cursor: params.cursor,
  });
  return { items, cursor: pagination.cursor };
}

export async function getBucket(
  id: string,
  apiKey: string
): Promise<GetContentBucketById200> {
  const client = createClient(apiKey);
  return client.buckets.get({ id });
}

export async function getPostBucket(
  postId: string,
  apiKey: string
): Promise<GetPostContentBucket200> {
  const client = createClient(apiKey);
  return client.buckets.forPost({ postId });
}

export async function createPostBucket(
  postId: string,
  apiKey: string
): Promise<CreatePostContentBucket200> {
  const client = createClient(apiKey);
  return client.buckets.createForPost({ postId });
}
