import { Command } from "commander";
import * as coins from "../../services/coins.js";
import { outputData, outputTable, writeInfo } from "../lib/output.js";
import { handleError } from "../lib/error.js";

export function registerCoinCommands(program: Command): void {
  const coin = program.command("coin").description("Manage coins");

  coin
    .command("get <id-or-address>")
    .description("Get coin details")
    .action(async function (this: Command, idOrAddress: string) {
      try {
        const data = await coins.getCoin(idOrAddress);
        const metadata = data.metadata as
          | Record<string, unknown>
          | undefined;
        outputData(
          this,
          {
            ID: data.id as string,
            Name: (metadata?.name || data.name) as string,
            Ticker: (metadata?.symbol || data.ticker) as string,
            Contract: data.contractAddress as string,
            Publication: data.publicationId as string,
          },
          data
        );
      } catch (err) {
        handleError(err);
      }
    });

  coin
    .command("popular")
    .description("List popular coins")
    .option("--limit <n>", "Max number of results (1-100)", "10")
    .option("--cursor <cursor>", "Pagination cursor from a previous request")
    .action(async function (this: Command, opts) {
      try {
        const limit = parseInt(opts.limit, 10);
        const result = await coins.getPopularCoins({
          limit,
          cursor: opts.cursor,
        });
        const items = result.items.slice(0, limit);
        outputTable(
          this,
          ["Name", "Ticker", "Contract"],
          items.map((c) => {
            const metadata = c.metadata as Record<string, unknown> | undefined;
            return [
              String(metadata?.name || c.name || ""),
              String(metadata?.symbol || c.ticker || ""),
              String(c.contractAddress || ""),
            ];
          }),
          items
        );
        if (result.cursor) {
          writeInfo(`Next page: --cursor ${result.cursor}`);
        }
      } catch (err) {
        handleError(err);
      }
    });

  coin
    .command("search")
    .description("Search for coins")
    .requiredOption("--query <q>", "Search query")
    .action(async function (this: Command, opts) {
      try {
        const items = await coins.searchCoins(opts.query);
        outputTable(
          this,
          ["Ticker", "Publication", "Contract"],
          items.map((r) => {
            const c = r.coin as Record<string, unknown> | undefined;
            const blog = r.blog as Record<string, unknown> | undefined;
            return [
              String(c?.ticker || ""),
              String(blog?.name || ""),
              String(c?.contractAddress || ""),
            ];
          }),
          items
        );
      } catch (err) {
        handleError(err);
      }
    });

  coin
    .command("holders <id-or-address>")
    .description("List coin holders")
    .option("--limit <n>", "Max number of results (1-100)", "10")
    .option("--cursor <cursor>", "Pagination cursor from a previous request")
    .action(async function (this: Command, idOrAddress: string, opts) {
      try {
        const result = await coins.getCoinHolders(idOrAddress, {
          limit: parseInt(opts.limit, 10),
          cursor: opts.cursor,
        });
        outputTable(
          this,
          ["Wallet", "Balance"],
          result.items.map((h) => [
            String(h.walletAddress || h.address || ""),
            String(h.balance || ""),
          ]),
          result.items
        );
        if (result.cursor) {
          writeInfo(`Next page: --cursor ${result.cursor}`);
        }
      } catch (err) {
        handleError(err);
      }
    });

  coin
    .command("quote <id-or-address>")
    .description("Get a price quote for a coin")
    .requiredOption("--amount <wei>", "Amount of ETH in wei")
    .action(async function (this: Command, idOrAddress: string, opts) {
      try {
        const result = await coins.getCoinQuote(idOrAddress, opts.amount);
        outputData(this, result, result);
      } catch (err) {
        handleError(err);
      }
    });

  coin
    .command("buy-args <id-or-address>")
    .description("Get transaction args to buy a coin")
    .requiredOption("--wallet <address>", "Buyer wallet address")
    .requiredOption("--amount <wei>", "Amount of ETH in wei")
    .action(async function (this: Command, idOrAddress: string, opts) {
      try {
        const result = await coins.getBuyArgs(
          idOrAddress,
          opts.wallet,
          opts.amount
        );
        outputData(this, result, result);
      } catch (err) {
        handleError(err);
      }
    });

  coin
    .command("sell-args <id-or-address>")
    .description("Get transaction args to sell a coin")
    .requiredOption("--wallet <address>", "Seller wallet address")
    .requiredOption("--amount <wei>", "Amount of coin in wei")
    .action(async function (this: Command, idOrAddress: string, opts) {
      try {
        const result = await coins.getSellArgs(
          idOrAddress,
          opts.wallet,
          opts.amount
        );
        outputData(this, result, result);
      } catch (err) {
        handleError(err);
      }
    });
}
