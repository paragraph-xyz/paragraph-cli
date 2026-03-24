import { createClient } from "./client.js";

export async function searchPosts(
  query: string
): Promise<Record<string, unknown>[]> {
  const client = createClient();
  return (await client.search.posts(query)) as Record<string, unknown>[];
}

export async function searchBlogs(
  query: string
): Promise<Record<string, unknown>[]> {
  const client = createClient();
  return (await client.search.blogs(query)) as Record<string, unknown>[];
}
