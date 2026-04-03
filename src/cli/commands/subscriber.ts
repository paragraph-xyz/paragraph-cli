import { Command } from "commander";
import { requireApiKey } from "../../services/auth.js";
import * as subscribers from "../../services/subscribers.js";
import { outputData, outputTable, writeSuccess, writeInfo, parseLimit } from "../lib/output.js";
import { handleError } from "../lib/error.js";
import { requireArg, formatDate } from "../lib/args.js";

export function registerSubscriberCommands(program: Command): void {
  const subscriber = program
    .command("subscriber")
    .description("Manage subscribers");

  subscriber
    .command("list")
    .description("List subscribers")
    .option("--limit <n>", "Max number of results (1-100)", "10")
    .option("--cursor <cursor>", "Pagination cursor from a previous request")
    .addHelpText("after", `
Examples:
  $ paragraph subscriber list
  $ paragraph subscriber list --limit 50
  $ paragraph subscriber list --json | jq '.data[].email'
  $ paragraph subscriber list --cursor <cursor-from-previous>`)
    .action(async function (this: Command, opts) {
      try {
        const apiKey = requireApiKey();
        const result = await subscribers.listSubscribers(apiKey, {
          limit: parseLimit(opts.limit),
          cursor: opts.cursor,
        });
        outputTable(
          this,
          ["Email", "Wallet", "Date"],
          result.items.map((s) => [
            s.email || "",
            s.walletAddress || "",
            formatDate({ createdAt: s.createdAt }),
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

  subscriber
    .command("count [publication-id]")
    .description("Get subscriber count for a publication")
    .option("--publication <id>", "Publication ID")
    .addHelpText("after", `
Examples:
  $ paragraph subscriber count abc123
  $ paragraph subscriber count --publication abc123
  $ paragraph subscriber count abc123 --json`)
    .action(async function (this: Command, positionalId: string | undefined, opts) {
      try {
        const id = requireArg(positionalId, opts.publication, "publication ID", "--publication");
        const count = await subscribers.getSubscriberCount(id);
        outputData(this, { Count: count }, { count });
      } catch (err) {
        handleError(err);
      }
    });

  subscriber
    .command("add")
    .description("Add a subscriber by email or wallet address")
    .option("--email <email>", "Subscriber email address")
    .option("--wallet <address>", "Subscriber wallet address (0x format)")
    .addHelpText("after", `
Examples:
  $ paragraph subscriber add --email user@example.com
  $ paragraph subscriber add --wallet 0x1234...abcd
  $ paragraph subscriber add --email user@example.com --json`)
    .action(async function (this: Command, opts) {
      try {
        if (!opts.email && !opts.wallet) {
          throw new Error("Provide --email or --wallet (or both).");
        }
        const apiKey = requireApiKey();
        await subscribers.addSubscriber({ email: opts.email, wallet: opts.wallet }, apiKey);
        writeSuccess(`Subscriber added: ${opts.email || opts.wallet}`);
        outputData(this, { Email: opts.email, Wallet: opts.wallet }, { email: opts.email, wallet: opts.wallet, added: true });
      } catch (err) {
        handleError(err);
      }
    });

  subscriber
    .command("import")
    .description("Import subscribers from a CSV file")
    .requiredOption("--csv <file>", "Path to CSV file")
    .addHelpText("after", `
Examples:
  $ paragraph subscriber import --csv ./subscribers.csv
  $ paragraph subscriber import --csv ./subscribers.csv --json`)
    .action(async function (this: Command, opts) {
      try {
        const apiKey = requireApiKey();
        await subscribers.importSubscribers(opts.csv, apiKey);
        writeSuccess(`Subscribers imported from ${opts.csv}`);
        outputData(this, { File: opts.csv }, { file: opts.csv, imported: true });
      } catch (err) {
        handleError(err);
      }
    });
}
