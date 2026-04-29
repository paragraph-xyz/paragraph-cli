import * as fs from "fs";
import { addSubscriberBody, removeSubscriberBody } from "@paragraph-com/sdk/zod";
import {
  ParagraphApiError,
  type ListSubscribers200ItemsItem,
} from "@paragraph-com/sdk";
import { createClient } from "./client.js";

export interface PaginatedResult<T> {
  items: T[];
  cursor?: string;
}

export async function listSubscribers(
  apiKey: string,
  pagination?: { limit?: number; cursor?: string }
): Promise<PaginatedResult<ListSubscribers200ItemsItem>> {
  const client = createClient(apiKey);
  const result = await client.subscribers.get(
    pagination?.limit || pagination?.cursor ? pagination : undefined
  );
  const data = result as { items: ListSubscribers200ItemsItem[]; pagination: { cursor?: string } };
  return { items: data.items, cursor: data.pagination?.cursor };
}

export async function getSubscriberCount(
  publicationId: string
): Promise<number> {
  const client = createClient();
  try {
    await client.publications.get({ id: publicationId }).single();
  } catch (err) {
    if (err instanceof ParagraphApiError && err.status === 404) {
      throw new Error(
        `Invalid publication ID "${publicationId}". Run \`paragraph whoami --json\` to get the valid publication ID.`
      );
    }
    throw err;
  }
  const result = await client.subscribers.getCount({ id: publicationId });
  return (result as { count: number }).count || 0;
}

export async function addSubscriber(
  params: { email?: string; wallet?: string },
  apiKey: string
): Promise<void> {
  addSubscriberBody.parse(params);
  const client = createClient(apiKey);
  await client.subscribers.create(params);
}

export async function removeSubscriber(
  params: { email?: string; wallet?: string },
  apiKey: string
): Promise<void> {
  removeSubscriberBody.parse(params);
  const client = createClient(apiKey);
  await client.subscribers.remove(params);
}

export async function importSubscribers(
  csvPath: string,
  apiKey: string
): Promise<void> {
  const client = createClient(apiKey);
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  // Use Blob (Node 18+) instead of File (Node 20+) for broader compatibility
  const file = new Blob([csvContent], { type: "text/csv" }) as File;
  await client.subscribers.importCsv({ file });
}
