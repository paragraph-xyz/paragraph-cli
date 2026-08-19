import * as fs from "fs";
import { Command } from "commander";
import { requireApiKey } from "../../services/auth.js";
import * as content from "../../services/content.js";
import {
  CONTENT_KINDS,
  type ContentBody,
  type ContentKind,
} from "../../services/content.js";
import {
  outputData,
  outputTable,
  parseLimit,
  writeInfo,
  writeSuccess,
} from "../lib/output.js";
import { handleError } from "../lib/error.js";
import { readStdin } from "../lib/stdin.js";
import { requireArg } from "../lib/args.js";

const KIND_LIST = CONTENT_KINDS.join("|");

interface BodyOpts {
  text?: string;
  file?: string;
  tweet?: string[];
  subject?: string;
  preheader?: string;
  headline?: string;
  canonicalUrl?: string;
}

function parseKind(value: string): ContentKind {
  if (!(CONTENT_KINDS as string[]).includes(value)) {
    throw new Error(`Invalid kind: "${value}". Use one of ${KIND_LIST}.`);
  }
  return value as ContentKind;
}

function collectTweets(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}

/** Resolve the piece's long text from --text, --file, or stdin. */
async function resolveText(opts: BodyOpts): Promise<string | undefined> {
  if (opts.text) return opts.text;
  if (opts.file) {
    if (!fs.existsSync(opts.file)) {
      throw new Error(
        `File not found: "${opts.file}". Check the path, or use --text <text> to pass content inline.`
      );
    }
    return fs.readFileSync(opts.file, "utf-8");
  }
  const stdin = await readStdin();
  return stdin || undefined;
}

function hasBodyFlags(opts: BodyOpts): boolean {
  return !!(
    opts.text ||
    opts.file ||
    opts.tweet?.length ||
    opts.subject ||
    opts.preheader ||
    opts.headline ||
    opts.canonicalUrl
  );
}

/**
 * Assemble the artifact in the shape its kind uses. The kind decides which
 * flags mean anything, so a flag that belongs to another kind is refused here
 * rather than silently dropped.
 */
async function buildBody(
  kind: ContentKind,
  opts: BodyOpts
): Promise<ContentBody> {
  const tweets = opts.tweet ?? [];

  if (kind !== "tweet" && tweets.length > 0) {
    throw new Error("--tweet is only valid for --kind tweet.");
  }
  if (kind !== "newsletter" && (opts.subject || opts.preheader)) {
    throw new Error(
      "--subject and --preheader are only valid for --kind newsletter."
    );
  }
  if (kind !== "x_article" && (opts.headline || opts.canonicalUrl)) {
    throw new Error(
      "--headline and --canonical-url are only valid for --kind x_article."
    );
  }

  if (kind === "tweet" && tweets.length > 0) {
    if (opts.text) {
      throw new Error(
        "Provide --text for a single post or --tweet for a thread, not both."
      );
    }
    return { tweets };
  }

  const text = await resolveText(opts);

  if (kind === "tweet" || kind === "linkedin") {
    if (!text) {
      throw new Error(
        "Provide the text via --text, --file, or stdin (or --tweet for a thread)."
      );
    }
    return { text };
  }

  if (kind === "newsletter") {
    if (!opts.subject) {
      throw new Error("A newsletter needs a subject line: --subject <subject>.");
    }
    if (!text) {
      throw new Error("Provide the email body via --text, --file, or stdin.");
    }
    return {
      subject: opts.subject,
      preheader: opts.preheader,
      body: text,
    };
  }

  if (!opts.headline) {
    throw new Error(
      "An X Article needs the headline X publishes: --headline <headline>."
    );
  }
  if (!text) {
    throw new Error(
      "Provide the article markdown via --text, --file, or stdin."
    );
  }
  return {
    title: opts.headline,
    body: text,
    canonicalUrl: opts.canonicalUrl,
  };
}

function addBodyOptions(cmd: Command): Command {
  return cmd
    .option(
      "--text <text>",
      "Body text: the post itself for tweet/linkedin, the email or article body otherwise"
    )
    .option("--file <path>", "Read the body from a file")
    .option(
      "--tweet <text>",
      "One tweet in a thread, in posting order (repeatable). tweet only",
      collectTweets,
      [] as string[]
    )
    .option("--subject <subject>", "Subject line. newsletter only")
    .option(
      "--preheader <preheader>",
      "Preview line shown after the subject. newsletter only"
    )
    .option(
      "--headline <headline>",
      "The headline X publishes. x_article only — separate from --title, which only names the piece in your library"
    )
    .option(
      "--canonical-url <url>",
      "The original post this Article is a version of. x_article only"
    );
}

function summarize(piece: {
  id: string;
  kind: string;
  title: string;
  status: string;
  scheduled?: boolean;
  lockedReason?: string | null;
  updatedAt?: string;
}): Record<string, unknown> {
  return {
    ID: piece.id,
    Kind: piece.kind,
    Title: piece.title,
    Status: piece.status,
    Scheduled: piece.scheduled ? "yes" : undefined,
    Locked: piece.lockedReason || undefined,
  };
}

function formatContentDate(piece: {
  publishedAt?: string | null;
  updatedAt?: string;
}): string {
  const raw = piece.publishedAt || piece.updatedAt;
  if (!raw) return "";
  const date = new Date(raw);
  return isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

export function registerContentCommands(program: Command): void {
  const contentCmd = program
    .command("content")
    .description(
      "Manage drafted content (X posts, LinkedIn posts, newsletters, X Articles)"
    );

  // create
  addBodyOptions(
    contentCmd
      .command("create")
      .description("Create a content draft")
      .requiredOption("--kind <kind>", `Kind of piece (${KIND_LIST})`)
      .requiredOption(
        "--title <title>",
        "What the piece is called in your library"
      )
  )
    .addHelpText(
      "after",
      `
Examples:
  $ paragraph content create --kind tweet --title "Launch note" --text "We shipped it."
  $ paragraph content create --kind tweet --title "Thread" --tweet "First." --tweet "Second."
  $ paragraph content create --kind linkedin --title "Launch note" --file ./post.md
  $ paragraph content create --kind newsletter --title "October update" --subject "What we shipped" --file ./body.md
  $ paragraph content create --kind x_article --title "Editor rewrite" --headline "Why we rebuilt the editor" --file ./article.md
  $ cat post.md | paragraph content create --kind linkedin --title "Launch note" --json`
    )
    .action(async function (this: Command, opts) {
      try {
        const apiKey = requireApiKey();
        const kind = parseKind(opts.kind);
        const body = await buildBody(kind, opts);

        const data = await content.createContent({
          apiKey,
          kind,
          title: opts.title,
          body,
        });

        writeSuccess(`Draft created: ${data.title}`);
        writeInfo("Nothing was sent — send it from the Paragraph app.");
        outputData(this, summarize(data), data);
      } catch (err) {
        handleError(err);
      }
    });

  // list
  contentCmd
    .command("list")
    .description("List your drafted content")
    .option("--kind <kind>", `Filter by kind (${KIND_LIST})`)
    .option(
      "--status <status>",
      "Filter by lifecycle (all|draft|published|archived). Default: all, which excludes archived pieces"
    )
    .option("--limit <n>", "Max number of results (1-50)", "20")
    .option("--cursor <cursor>", "Pagination cursor from a previous request")
    .addHelpText(
      "after",
      `
Examples:
  $ paragraph content list
  $ paragraph content list --kind tweet --status draft
  $ paragraph content list --status archived --limit 50 --json
  $ paragraph content list --json | jq -r '.data[].id'`
    )
    .action(async function (this: Command, opts) {
      try {
        const apiKey = requireApiKey();
        const kind = opts.kind ? parseKind(opts.kind) : undefined;
        const result = await content.listContent({
          apiKey,
          kind,
          status: opts.status,
          limit: parseLimit(opts.limit, 50),
          cursor: opts.cursor,
        });

        const headers = ["ID", "Kind", "Title", "Status", "Date"];
        const rows = result.items.map((p) => [
          p.id,
          p.kind,
          p.title,
          p.status,
          formatContentDate(p),
        ]);

        outputTable(this, headers, rows, result.items, {
          cursor: result.cursor,
        });
        if (result.cursor) {
          writeInfo(`Next page: --cursor ${result.cursor}`);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // get
  contentCmd
    .command("get [id]")
    .description("Get a piece of content, with its body")
    .option("--id <id>", "Content ID")
    .option(
      "--field <name>",
      "Output a single field value (e.g., body, title, status)"
    )
    .addHelpText(
      "after",
      `
Examples:
  $ paragraph content get abc123
  $ paragraph content get --id abc123 --json
  $ paragraph content get abc123 --field body
  $ paragraph content get abc123 --json | jq '.body.tweets'`
    )
    .action(async function (this: Command, id: string | undefined, opts) {
      try {
        const apiKey = requireApiKey();
        const contentId = requireArg(id, opts.id, "content ID");
        const data = await content.getContent(contentId, apiKey);

        if (opts.field) {
          const value = (data as Record<string, unknown>)[opts.field];
          if (value === undefined) {
            throw new Error(
              `Field "${opts.field}" not found. Available: ${Object.keys(data).join(", ")}`
            );
          }
          process.stdout.write(
            typeof value === "object" && value !== null
              ? JSON.stringify(value, null, 2)
              : String(value)
          );
          if (process.stdout.isTTY) process.stdout.write("\n");
          return;
        }

        outputData(
          this,
          { ...summarize(data), Excerpt: data.excerpt },
          data
        );
      } catch (err) {
        handleError(err);
      }
    });

  // update
  addBodyOptions(
    contentCmd
      .command("update [id]")
      .description("Rename a piece of content, replace its body, or both")
      .option("--id <id>", "Content ID")
      .option("--title <title>", "New name for this piece in your library")
  )
    .addHelpText(
      "after",
      `
Examples:
  $ paragraph content update abc123 --title "Launch note, second pass"
  $ paragraph content update --id abc123 --text "Rewritten, and shorter."
  $ paragraph content update abc123 --tweet "First." --tweet "Second."
  $ cat rewrite.md | paragraph content update abc123 --json

The body is replaced, not merged — send the whole artifact. A queued send locks
the words; renaming is always allowed.`
    )
    .action(async function (this: Command, id: string | undefined, opts) {
      try {
        const apiKey = requireApiKey();
        const contentId = requireArg(id, opts.id, "content ID");

        if (!opts.title && !hasBodyFlags(opts)) {
          throw new Error(
            "Nothing to update. Provide --title, or a body via --text, --file, --tweet, --subject, --preheader, --headline, or --canonical-url."
          );
        }

        // The kind decides the body's shape, and the server owns it — read the
        // piece so a rewrite goes back in the shape it came out in.
        const body = hasBodyFlags(opts)
          ? await buildBody(
              parseKind((await content.getContent(contentId, apiKey)).kind),
              opts
            )
          : undefined;

        const data = await content.updateContent(contentId, {
          apiKey,
          title: opts.title,
          body,
        });

        writeSuccess(`Draft updated: ${data.title}`);
        outputData(this, summarize(data), data);
      } catch (err) {
        handleError(err);
      }
    });

  // archive
  contentCmd
    .command("archive [id]")
    .description("Archive a piece of content")
    .option("--id <id>", "Content ID")
    .option("--dry-run", "Preview what would be archived without archiving")
    .addHelpText(
      "after",
      `
Examples:
  $ paragraph content archive abc123
  $ paragraph content archive --id abc123 --dry-run
  $ paragraph content archive abc123 --json`
    )
    .action(async function (this: Command, id: string | undefined, opts) {
      try {
        const apiKey = requireApiKey();
        const contentId = requireArg(id, opts.id, "content ID");

        if (opts.dryRun) {
          const data = await content.getContent(contentId, apiKey);
          writeInfo(`Would archive: ${data.title}`);
          outputData(
            this,
            { ...summarize(data), Action: "archive (dry-run)" },
            { ...data, dryRun: true }
          );
          return;
        }

        await content.archiveContent(contentId, apiKey);
        writeSuccess(`Content archived: ${contentId}`);
        writeInfo("Restore it with `paragraph content restore`.");
        outputData(
          this,
          { ID: contentId, Status: "archived" },
          { id: contentId, status: "archived" }
        );
      } catch (err) {
        handleError(err);
      }
    });

  // restore
  contentCmd
    .command("restore [id]")
    .description("Restore an archived piece of content")
    .option("--id <id>", "Content ID")
    .addHelpText(
      "after",
      `
Examples:
  $ paragraph content restore abc123
  $ paragraph content restore --id abc123 --json
  $ paragraph content list --status archived --json | jq -r '.data[].id'`
    )
    .action(async function (this: Command, id: string | undefined, opts) {
      try {
        const apiKey = requireApiKey();
        const contentId = requireArg(id, opts.id, "content ID");
        await content.restoreContent(contentId, apiKey);
        writeSuccess(`Content restored: ${contentId}`);
        outputData(
          this,
          { ID: contentId, Status: "restored" },
          { id: contentId, restored: true }
        );
      } catch (err) {
        handleError(err);
      }
    });
}
