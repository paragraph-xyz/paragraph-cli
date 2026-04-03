import { Command } from "commander";
import * as coins from "../../services/coins.js";
import { outputData, outputTable, writeInfo, parseLimit } from "../lib/output.js";
import { handleError } from "../lib/error.js";
import { requireArg } from "../lib/args.js";

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
        const id = requireArg(positionalId, opts.id, "coin ID or address");
        const data = await coins.getCoin(id);
        outputData(
          this,
          {
            ID: data.id,
            Name: data.metadata.name,
            Ticker: data.metadata.symbol,
            Contract: data.contractAddress,
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
        const result = await coins.getPopularCoins({
          limit: parseLimit(opts.limit),
          cursor: opts.cursor,
        });
        outputTable(
          this,
          ["Name", "Ticker", "Contract"],
          result.items.map((c) => [
            c.metadata.name,
            c.metadata.symbol,
            c.contractAddress,
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
          items.map((r) => [
            r.coin.ticker || "",
            r.blog.name || "",
            r.coin.contractAddress || "",
          ]),
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
        const id = requireArg(positionalId, opts.id, "coin ID or address");
        const result = await coins.getCoinHolders(id, {
          limit: parseLimit(opts.limit),
          cursor: opts.cursor,
        });
        outputTable(
          this,
          ["Wallet", "Balance"],
          result.items.map((h) => [
            h.walletAddress,
            h.balance,
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
        const id = requireArg(positionalId, opts.id, "coin ID or address");
        const result = await coins.getCoinQuote(id, opts.amount);
        outputData(this, result, result);
      } catch (err) {
        handleError(err);
      }
    });

}
