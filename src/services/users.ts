import { createClient } from "./client.js";

export async function getUser(
  idOrWallet: string
): Promise<Record<string, unknown>> {
  const client = createClient();
  const identifier = idOrWallet.startsWith("0x")
    ? { wallet: idOrWallet }
    : { id: idOrWallet };
  const user = await client.users.get(identifier).single();
  return user as Record<string, unknown>;
}
