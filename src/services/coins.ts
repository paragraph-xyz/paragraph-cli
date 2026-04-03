import type {
  GetCoin200,
  GetCoinHoldersById200ItemsItem,
  GetQuoteById200,
} from "@paragraph-com/sdk";
import { createClient } from "./client.js";

function coinIdentifier(idOrAddress: string) {
  return idOrAddress.startsWith("0x")
    ? { contractAddress: idOrAddress }
    : { id: idOrAddress };
}

export async function getCoin(
  idOrAddress: string
): Promise<GetCoin200> {
  const client = createClient();
  return client.coins.get(coinIdentifier(idOrAddress)).single();
}

export interface PaginatedResult<T> {
  items: T[];
  cursor?: string;
}

export async function getPopularCoins(pagination?: {
  limit?: number;
  cursor?: string;
}): Promise<PaginatedResult<GetCoin200>> {
  const client = createClient();
  const { items, pagination: pag } = await client.coins.get({ sortBy: "popular" });
  return { items, cursor: pag.cursor };
}

export async function searchCoins(
  query: string
) {
  const client = createClient();
  return client.search.coins(query);
}

export async function getCoinQuote(
  idOrAddress: string,
  amount: string
): Promise<GetQuoteById200> {
  const client = createClient();
  return client.coins.getQuote(
    coinIdentifier(idOrAddress),
    BigInt(amount)
  ) as Promise<GetQuoteById200>;
}

export async function getCoinHolders(
  idOrAddress: string,
  pagination?: { limit?: number; cursor?: string }
): Promise<PaginatedResult<GetCoinHoldersById200ItemsItem>> {
  const client = createClient();
  const result = await client.coins.getHolders(
    coinIdentifier(idOrAddress),
    pagination?.limit || pagination?.cursor
      ? { limit: pagination?.limit, cursor: pagination?.cursor }
      : undefined
  );
  const data = result as { items: GetCoinHoldersById200ItemsItem[]; pagination: { cursor?: string } };
  return { items: data.items, cursor: data.pagination?.cursor };
}
