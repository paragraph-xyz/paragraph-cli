import { createClient } from "./client.js";

function coinIdentifier(idOrAddress: string) {
  return idOrAddress.startsWith("0x")
    ? { contractAddress: idOrAddress }
    : { id: idOrAddress };
}

export async function getCoin(
  idOrAddress: string
): Promise<Record<string, unknown>> {
  const client = createClient();
  const coin = await client.coins.get(coinIdentifier(idOrAddress)).single();
  return coin as Record<string, unknown>;
}

export interface PaginatedResult {
  items: Record<string, unknown>[];
  cursor?: string;
}

export async function getPopularCoins(pagination?: {
  limit?: number;
  cursor?: string;
}): Promise<PaginatedResult> {
  const client = createClient();
  const query: Record<string, unknown> = { sortBy: "popular" };
  if (pagination?.limit) query.limit = pagination.limit;
  if (pagination?.cursor) query.cursor = pagination.cursor;
  const result = await client.coins.get(
    query as Parameters<typeof client.coins.get>[0]
  );
  const data = result as { items: Record<string, unknown>[]; cursor?: string };
  return { items: data.items, cursor: data.cursor };
}

export async function searchCoins(
  query: string
): Promise<Record<string, unknown>[]> {
  const client = createClient();
  return (await client.search.coins(query)) as Record<string, unknown>[];
}

export async function getBuyArgs(
  idOrAddress: string,
  walletAddress: string,
  amount: string
): Promise<Record<string, unknown>> {
  const { default: axios } = await import("axios");
  const base =
    process.env.PARAGRAPH_API_URL || "https://public.api.paragraph.com/api";
  const path = idOrAddress.startsWith("0x")
    ? `/v1/coins/buy/contract/${idOrAddress}`
    : `/v1/coins/buy/${idOrAddress}`;
  const res = await axios.get(`${base}${path}`, {
    params: { walletAddress, amount },
  });
  return res.data as Record<string, unknown>;
}

export async function getSellArgs(
  idOrAddress: string,
  walletAddress: string,
  amount: string
): Promise<Record<string, unknown>> {
  const { default: axios } = await import("axios");
  const base =
    process.env.PARAGRAPH_API_URL || "https://public.api.paragraph.com/api";
  const path = idOrAddress.startsWith("0x")
    ? `/v1/coins/sell/contract/${idOrAddress}`
    : `/v1/coins/sell/${idOrAddress}`;
  const res = await axios.get(`${base}${path}`, {
    params: { walletAddress, amount },
  });
  return res.data as Record<string, unknown>;
}

export async function getCoinQuote(
  idOrAddress: string,
  amount: string
): Promise<Record<string, unknown>> {
  const client = createClient();
  const result = await client.coins.getQuote(
    coinIdentifier(idOrAddress),
    BigInt(amount)
  );
  return result as Record<string, unknown>;
}

export async function getCoinHolders(
  idOrAddress: string,
  pagination?: { limit?: number; cursor?: string }
): Promise<PaginatedResult> {
  const client = createClient();
  const query: Record<string, unknown> = {};
  if (pagination?.limit) query.limit = pagination.limit;
  if (pagination?.cursor) query.cursor = pagination.cursor;
  const result = await client.coins.getHolders(
    coinIdentifier(idOrAddress),
    Object.keys(query).length ? query as Parameters<typeof client.coins.getHolders>[1] : undefined
  );
  const data = result as Record<string, unknown>;
  const items = (data.items ||
    data.holders ||
    (Array.isArray(data) ? data : [])) as Record<string, unknown>[];
  return { items, cursor: data.cursor as string | undefined };
}
