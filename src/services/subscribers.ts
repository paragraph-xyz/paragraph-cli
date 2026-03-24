import * as fs from "fs";
import { createClient } from "./client.js";

export interface PaginatedResult {
  items: Record<string, unknown>[];
  cursor?: string;
}

export async function listSubscribers(
  apiKey: string,
  pagination?: { limit?: number; cursor?: string }
): Promise<PaginatedResult> {
  const client = createClient(apiKey);
  const query: Record<string, unknown> = {};
  if (pagination?.limit) query.limit = pagination.limit;
  if (pagination?.cursor) query.cursor = pagination.cursor;
  const result = await client.subscribers.get(
    Object.keys(query).length ? query as Parameters<typeof client.subscribers.get>[0] : undefined
  );
  const data = result as { items: Record<string, unknown>[]; pagination?: { cursor?: string; hasMore?: boolean } };
  return { items: data.items, cursor: data.pagination?.cursor };
}

export async function getSubscriberCount(
  publicationId: string
): Promise<number> {
  const client = createClient();
  const result = (await client.subscribers.getCount({
    id: publicationId,
  })) as Record<string, unknown>;
  return (result.count as number) || 0;
}

export async function addSubscriber(
  email: string,
  apiKey: string
): Promise<void> {
  const client = createClient(apiKey);
  await client.subscribers.create({ email });
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
