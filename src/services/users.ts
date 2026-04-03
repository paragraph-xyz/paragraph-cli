import type { GetUser200 } from "@paragraph-com/sdk";
import { createClient } from "./client.js";

export async function getUser(
  idOrWallet: string
): Promise<GetUser200> {
  const client = createClient();
  const identifier = idOrWallet.startsWith("0x")
    ? { wallet: idOrWallet }
    : { id: idOrWallet };
  return client.users.get(identifier).single();
}
