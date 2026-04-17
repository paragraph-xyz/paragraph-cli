import * as readline from "readline";
import { Command } from "commander";
import pc from "picocolors";
import { writeConfig, deleteConfig } from "../../services/config.js";
import { requireApiKey, validateApiKey } from "../../services/auth.js";
import {
  createLoginSession,
  waitForLogin,
  openBrowser,
} from "../../services/browser-auth.js";
import { outputData, writeSuccess, writeInfo } from "../lib/output.js";
import { handleError } from "../lib/error.js";

function prompt(message: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function loginWithToken(): Promise<string> {
  writeInfo("Get your API key from paragraph.com/settings → Publication → Developer\n");
  const token = await prompt("Paste your API key: ");
  if (!token) throw new Error("No API key provided.");
  return token;
}

async function loginWithBrowser(): Promise<string> {
  process.stderr.write("Creating login session...\n");
  const session = await createLoginSession();
  process.stderr.write(
    `\n  Open this URL in your browser to log in:\n\n` +
      `  ${pc.bold(pc.underline(session.verificationUrl))}\n\n`
  );
  // Don't block on browser open — user already has the URL
  openBrowser(session.verificationUrl).catch(() => {});
  process.stderr.write("Waiting for authentication...\n");
  return waitForLogin(session.sessionId);
}

export function registerAuthCommands(program: Command): void {
  program
    .command("login")
    .description("Authenticate with Paragraph")
    .option("--token <token>", "API key (skips interactive prompt)")
    .option("--with-token", "Read API key from stdin")
    .addHelpText("after", `
Examples:
  $ paragraph login
  $ paragraph login --token pk_abc123
  $ echo "pk_abc123" | paragraph login --with-token`)
    .action(async (opts) => {
      try {
        let token: string;

        if (opts.token) {
          token = opts.token;
        } else if (opts.withToken) {
          const chunks: Buffer[] = [];
          for await (const chunk of process.stdin) {
            chunks.push(chunk);
          }
          token = Buffer.concat(chunks).toString("utf-8").trim();
          if (!token) throw new Error("No API key received on stdin. Pipe the key (e.g. `echo $PARAGRAPH_API_KEY | paragraph login --with-token`) or use --token <key>.");
        } else if (!process.stdin.isTTY) {
          throw new Error(
            "No --token provided and stdin is not a TTY. Use --token <key> or --with-token."
          );
        } else {
          writeInfo("How would you like to authenticate?\n");
          writeInfo("  1. Log in with browser (recommended)");
          writeInfo("  2. Paste an API key\n");
          const choice = await prompt("Your choice (1/2): ");

          if (choice === "2") {
            token = await loginWithToken();
          } else {
            try {
              token = await loginWithBrowser();
            } catch (err) {
              const message =
                err instanceof Error ? err.message : String(err);
              if (
                message.includes("404") ||
                message.includes("ECONNREFUSED") ||
                message.includes("Not found")
              ) {
                writeInfo(
                  "\nBrowser login is not available yet. Falling back to API key.\n"
                );
                token = await loginWithToken();
              } else {
                throw err;
              }
            }
          }
        }

        const me = await validateApiKey(token);
        writeConfig({ apiKey: token });
        writeSuccess(
          `Logged in as ${me.name || me.slug || "your publication"}`
        );
      } catch (err) {
        handleError(err);
      }
    });

  program
    .command("logout")
    .description("Remove stored API key")
    .addHelpText("after", `
Examples:
  $ paragraph logout`)
    .action(async () => {
      try {
        deleteConfig();
        writeSuccess("Logged out.");
      } catch (err) {
        handleError(err);
      }
    });

  program
    .command("whoami")
    .description("Show the current authenticated publication")
    .addHelpText("after", `
Examples:
  $ paragraph whoami
  $ paragraph whoami --json`)
    .action(async function (this: Command) {
      try {
        const apiKey = requireApiKey();
        const me = await validateApiKey(apiKey);
        outputData(this, {
          ID: me.id as string,
          Name: me.name as string,
          Slug: me.slug as string,
          Domain: me.customDomain as string,
        });
      } catch (err) {
        handleError(err);
      }
    });
}
