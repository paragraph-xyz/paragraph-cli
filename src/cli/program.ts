import { Command } from "commander";
import { registerAuthCommands } from "./commands/auth.js";
import { registerPostCommands } from "./commands/post.js";
import { registerPublicationCommands } from "./commands/publication.js";
import { registerSearchCommands } from "./commands/search.js";
import { registerSubscriberCommands } from "./commands/subscriber.js";
import { registerCoinCommands } from "./commands/coin.js";
import { registerUserCommands } from "./commands/user.js";
import { registerAnalyticsCommands } from "./commands/analytics.js";

declare const process: NodeJS.Process & { env: { CLI_VERSION?: string } };

export function createProgram(): Command {
  const program = new Command();

  program
    .name("paragraph")
    .description("CLI for Paragraph")
    .version(process.env.CLI_VERSION || "0.0.0", "-v, --version")
    .option("--json", "Output as JSON")
    .option("--verbose", "Show detailed output for debugging")
    .exitOverride()
    .configureOutput({
      writeOut: (str) => process.stdout.write(str),
      writeErr: (str) => {
        if (process.argv.includes("--json")) {
          process.stderr.write(
            JSON.stringify({ error: str.trim() }, null, 2) + "\n"
          );
        } else {
          process.stderr.write(str);
        }
      },
    });

  registerAuthCommands(program);
  registerPostCommands(program);
  registerPublicationCommands(program);
  registerSearchCommands(program);
  registerSubscriberCommands(program);
  registerCoinCommands(program);
  registerUserCommands(program);
  registerAnalyticsCommands(program);

  return program;
}
