import * as fs from "fs";
import { Command } from "commander";
import { requireApiKey } from "../../services/auth.js";
import * as emails from "../../services/emails.js";
import { outputData, writeInfo, writeSuccess } from "../lib/output.js";
import { handleError } from "../lib/error.js";
import { readStdin } from "../lib/stdin.js";
import { confirm } from "../lib/prompt.js";

async function resolveBody(opts: {
  body?: string;
  bodyFile?: string;
}): Promise<string | undefined> {
  if (opts.body) return opts.body;
  if (opts.bodyFile) {
    if (!fs.existsSync(opts.bodyFile)) {
      throw new Error(
        `File not found: "${opts.bodyFile}". Check the path, or use --body <markdown> to pass content inline.`
      );
    }
    return fs.readFileSync(opts.bodyFile, "utf-8");
  }
  const stdin = await readStdin();
  return stdin || undefined;
}

function collectRecipients(value: string, previous: string[]): string[] {
  const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
  return previous.concat(parts);
}

export function registerEmailCommands(program: Command): void {
  const email = program
    .command("email")
    .description("Send custom emails from your publication");

  email
    .command("send")
    .description("Send a custom markdown email to a list of recipients")
    .requiredOption("--subject <subject>", "Email subject")
    .option("--body <markdown>", "Email body as markdown string")
    .option("--body-file <path>", "Read email body from a file")
    .option(
      "--to <emails>",
      "Recipient email (repeatable, or comma-separated)",
      collectRecipients,
      [] as string[]
    )
    .option(
      "--dry-run",
      "Run filtering and show the accepted/skipped split without sending"
    )
    .option("--yes", "Skip the confirmation prompt before sending")
    .addHelpText(
      "after",
      `
Examples:
  $ paragraph email send --subject "Hello" --body "# Hi" --to reader@example.com
  $ paragraph email send --subject "Update" --body-file ./body.md --to a@x.com --to b@x.com
  $ paragraph email send --subject "Update" --body-file ./body.md --to "a@x.com,b@x.com"
  $ cat body.md | paragraph email send --subject "Update" --to reader@example.com
  $ paragraph email send --subject "Update" --body "# Hi" --to a@x.com --dry-run`
    )
    .action(async function (this: Command, opts) {
      try {
        const apiKey = requireApiKey();
        const body = await resolveBody(opts);
        if (!body) {
          throw new Error(
            "Provide email body via --body, --body-file, or pipe to stdin."
          );
        }
        const recipients = opts.to as string[];
        if (recipients.length === 0) {
          throw new Error(
            "Provide at least one recipient via --to <email>. Repeat the flag or pass a comma-separated list."
          );
        }

        if (!opts.dryRun && !opts.yes) {
          if (!process.stdin.isTTY) {
            throw new Error(
              "Cannot confirm send in non-interactive mode. Use --yes to confirm, or --dry-run to preview."
            );
          }
          const ok = await confirm(
            `Send "${opts.subject}" to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}?`
          );
          if (!ok) {
            process.stderr.write("Aborted.\n");
            process.exit(1);
          }
        }

        const result = await emails.sendCustomEmail({
          apiKey,
          subject: opts.subject,
          body,
          emails: recipients,
          dryRun: opts.dryRun,
        });

        const action = opts.dryRun ? "Dry run" : "Email queued";
        writeSuccess(
          `${action}: ${result.accepted} accepted, ${result.skipped.length} skipped`
        );

        if (result.skipped.length > 0) {
          writeInfo("Skipped recipients:");
          for (const s of result.skipped) {
            process.stderr.write(`  ${s.email} — ${s.reason}\n`);
          }
        }

        outputData(
          this,
          {
            Subject: opts.subject,
            Recipients: recipients.length,
            Accepted: result.accepted,
            Skipped: result.skipped.length,
            DryRun: opts.dryRun ? "yes" : "no",
          },
          { ...result, dryRun: !!opts.dryRun }
        );
      } catch (err) {
        handleError(err);
      }
    });
}
