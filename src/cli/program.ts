import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { Command } from "commander";
import { registerAuthCommands } from "./commands/auth.js";
import { registerPostCommands } from "./commands/post.js";
import { registerPublicationCommands } from "./commands/publication.js";
import { registerSearchCommands } from "./commands/search.js";
import { registerSubscriberCommands } from "./commands/subscriber.js";
import { registerCoinCommands } from "./commands/coin.js";
import { registerUserCommands } from "./commands/user.js";

function getVersion(): string {
  try {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(
      fs.readFileSync(path.join(dir, "..", "package.json"), "utf-8")
    );
    return pkg.version;
  } catch {
    return "0.0.0";
  }
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name("paragraph")
    .description("CLI for Paragraph")
    .version(getVersion(), "-v, --version")
    .option("--json", "Output as JSON")
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

  return program;
}
