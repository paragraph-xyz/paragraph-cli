import { Command } from "commander";
import { requireApiKey } from "../../services/auth.js";
import * as subscribers from "../../services/subscribers.js";
import { outputData, outputTable, writeSuccess, writeInfo } from "../lib/output.js";
import { handleError } from "../lib/error.js";

export function registerSubscriberCommands(program: Command): void {
  const subscriber = program
    .command("subscriber")
    .description("Manage subscribers");

  subscriber
    .command("list")
    .description("List subscribers")
    .option("--limit <n>", "Max number of results (1-100)", "10")
    .option("--cursor <cursor>", "Pagination cursor from a previous request")
    .action(async function (this: Command, opts) {
      try {
        const apiKey = requireApiKey();
        const result = await subscribers.listSubscribers(apiKey, {
          limit: parseInt(opts.limit, 10),
          cursor: opts.cursor,
        });
        outputTable(
          this,
          ["Email", "Wallet", "Date"],
          result.items.map((s) => [
            String(s.email || ""),
            String(s.walletAddress || ""),
            s.createdAt
              ? new Date(s.createdAt as string).toLocaleDateString()
              : "",
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

  subscriber
    .command("count <publication-id>")
    .description("Get subscriber count for a publication")
    .action(async function (this: Command, publicationId: string) {
      try {
        const count = await subscribers.getSubscriberCount(publicationId);
        outputData(this, { Count: count }, { count });
      } catch (err) {
        handleError(err);
      }
    });

  subscriber
    .command("add")
    .description("Add a subscriber")
    .requiredOption("--email <email>", "Subscriber email address")
    .action(async function (this: Command, opts) {
      try {
        const apiKey = requireApiKey();
        await subscribers.addSubscriber(opts.email, apiKey);
        writeSuccess(`Subscriber added: ${opts.email}`);
      } catch (err) {
        handleError(err);
      }
    });

  subscriber
    .command("import")
    .description("Import subscribers from a CSV file")
    .requiredOption("--csv <file>", "Path to CSV file")
    .action(async function (this: Command, opts) {
      try {
        const apiKey = requireApiKey();
        await subscribers.importSubscribers(opts.csv, apiKey);
        writeSuccess(`Subscribers imported from ${opts.csv}`);
      } catch (err) {
        handleError(err);
      }
    });
}
