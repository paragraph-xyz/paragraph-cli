import type { SearchPosts200Item, SearchBlogs200Item } from "@paragraph-com/sdk";
import { createClient } from "./client.js";

export async function searchPosts(
  query: string
): Promise<SearchPosts200Item[]> {
  const client = createClient();
  return client.search.posts(query);
}

export async function searchBlogs(
  query: string
): Promise<SearchBlogs200Item[]> {
  const client = createClient();
  return client.search.blogs(query);
}
