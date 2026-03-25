import { Command } from "commander";
import * as coins from "../../services/coins.js";
import { outputData, outputTable, writeInfo, parseLimit } from "../lib/output.js";
import { handleError } from "../lib/error.js";

export function registerCoinCommands(program: Command): void {
  const coin = program.command("coin").description("Manage coins");

  coin
    .command("get [id-or-address]")
    .description("Get coin details")
    .option("--id <id-or-address>", "Coin ID or contract address")
    .addHelpText("after", `
Examples:
  $ paragraph coin get abc123
  $ paragraph coin get --id 0x1234...abcd
  $ paragraph coin get abc123 --json`)
    .action(async function (this: Command, positionalId: string | undefined, opts) {
      try {
        const id = positionalId || opts.id;
        if (!id) throw new Error("Missing coin ID or address. Pass it as an argument or with --id.");
        const data = await coins.getCoin(id);
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
    .addHelpText("after", `
Examples:
  $ paragraph coin popular
  $ paragraph coin popular --limit 20
  $ paragraph coin popular --json | jq '.data[].contractAddress'`)
    .action(async function (this: Command, opts) {
      try {
        const limit = parseLimit(opts.limit);
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
          items,
          { cursor: result.cursor }
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
    .addHelpText("after", `
Examples:
  $ paragraph coin search --query "ethereum"
  $ paragraph coin search --query "eth" --json`)
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
    .command("holders [id-or-address]")
    .description("List coin holders")
    .option("--id <id-or-address>", "Coin ID or contract address")
    .option("--limit <n>", "Max number of results (1-100)", "10")
    .option("--cursor <cursor>", "Pagination cursor from a previous request")
    .addHelpText("after", `
Examples:
  $ paragraph coin holders abc123
  $ paragraph coin holders --id 0x1234...abcd
  $ paragraph coin holders abc123 --limit 50 --json`)
    .action(async function (this: Command, positionalId: string | undefined, opts) {
      try {
        const id = positionalId || opts.id;
        if (!id) throw new Error("Missing coin ID or address. Pass it as an argument or with --id.");
        const result = await coins.getCoinHolders(id, {
          limit: parseLimit(opts.limit),
          cursor: opts.cursor,
        });
        outputTable(
          this,
          ["Wallet", "Balance"],
          result.items.map((h) => [
            String(h.walletAddress || ""),
            String(h.balance || ""),
          ]),
          result.items,
          { cursor: result.cursor }
        );
        if (result.cursor) {
          writeInfo(`Next page: --cursor ${result.cursor}`);
        }
      } catch (err) {
        handleError(err);
      }
    });

  coin
    .command("quote [id-or-address]")
    .description("Get a price quote for a coin")
    .option("--id <id-or-address>", "Coin ID or contract address")
    .requiredOption("--amount <wei>", "Amount of ETH in wei")
    .addHelpText("after", `
Examples:
  $ paragraph coin quote abc123 --amount 1000000000000000000
  $ paragraph coin quote --id 0x1234...abcd --amount 1000000000000000000
  $ paragraph coin quote abc123 --amount 1000000000000000000 --json`)
    .action(async function (this: Command, positionalId: string | undefined, opts) {
      try {
        const id = positionalId || opts.id;
        if (!id) throw new Error("Missing coin ID or address. Pass it as an argument or with --id.");
        const result = await coins.getCoinQuote(id, opts.amount);
        outputData(this, result, result);
      } catch (err) {
        handleError(err);
      }
    });

}
