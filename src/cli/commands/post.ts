import * as fs from "fs";
import { Command } from "commander";
import { getApiKey, requireApiKey } from "../../services/auth.js";
import * as posts from "../../services/posts.js";
import { outputData, outputTable, writeSuccess, writeInfo } from "../lib/output.js";
import { handleError } from "../lib/error.js";
import { readStdin } from "../lib/stdin.js";
import { confirm } from "../lib/prompt.js";

function formatDate(p: Record<string, unknown>): string {
  const raw = (p.publishedAt || p.createdAt || p.updatedAt) as string | undefined;
  if (!raw) return "";
  const n = Number(raw);
  const date = isNaN(n) ? new Date(raw) : new Date(n);
  return isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

async function resolveMarkdown(opts: {
  text?: string;
  file?: string;
}): Promise<string | undefined> {
  if (opts.text) return opts.text;
  if (opts.file) return fs.readFileSync(opts.file, "utf-8");
  const stdin = await readStdin();
  return stdin || undefined;
}

export function registerPostCommands(program: Command): void {
  const post = program.command("post").description("Manage posts");

  // create
  const createCmd = (parent: Command) =>
    parent
      .command("create")
      .description("Create a new post")
      .requiredOption("--title <title>", "Post title")
      .option("--text <markdown>", "Post content as markdown string")
      .option("--file <path>", "Read post content from a file")
      .option("--subtitle <subtitle>", "Post subtitle")
      .option("--tags <tags>", "Comma-separated tags")
      .action(async function (this: Command, opts) {
        try {
          const apiKey = requireApiKey();
          const markdown = await resolveMarkdown(opts);
          if (!markdown)
            throw new Error(
              "Provide content via --text, --file, or pipe to stdin."
            );

          const data = await posts.createPost({
            apiKey,
            title: opts.title,
            markdown,
            subtitle: opts.subtitle,
            tags: opts.tags
              ?.split(",")
              .map((t: string) => t.trim()),
          });

          writeSuccess(`Post created: ${data.title || opts.title}`);
          outputData(
            this,
            {
              ID: data.id as string,
              Title: (data.title || opts.title) as string,
              Slug: data.slug as string,
            },
            data
          );
        } catch (err) {
          handleError(err);
        }
      });

  // list
  post
    .command("list")
    .description("List posts")
    .option(
      "--publication <id>",
      "Publication ID or slug (list public posts)"
    )
    .option(
      "--status <status>",
      "Filter by status (draft|published|scheduled|archived)"
    )
    .option("--limit <n>", "Max number of results (1-100)", "10")
    .option("--cursor <cursor>", "Pagination cursor from a previous request")
    .action(async function (this: Command, opts) {
      try {
        const apiKey = opts.publication ? getApiKey() : requireApiKey();
        const result = await posts.listPosts({
          apiKey,
          publicationId: opts.publication,
          status: opts.status,
          limit: parseInt(opts.limit, 10),
          cursor: opts.cursor,
        });

        const headers = ["ID", "Title", "Date"];
        const rows = result.items.map((p) => [
          String(p.id || ""),
          String(p.title || ""),
          formatDate(p),
        ]);

        outputTable(this, headers, rows, result.items);
        if (result.cursor) {
          writeInfo(`Next page: --cursor ${result.cursor}`);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // get — accepts ID, URL, or @pub-slug/post-slug
  post
    .command("get <identifier>")
    .description("Get a post by ID, URL, or @publication/slug")
    .option("--field <name>", "Output a single field value (e.g., markdown, title)")
    .action(async function (this: Command, identifier: string, opts) {
      try {
        const data = await posts.resolvePost(identifier, getApiKey());

        if (opts.field) {
          const value = data[opts.field];
          if (value === undefined) {
            throw new Error(`Field "${opts.field}" not found. Available: ${Object.keys(data).join(", ")}`);
          }
          process.stdout.write(String(value));
          if (process.stdout.isTTY) process.stdout.write("\n");
          return;
        }

        const markdown = data.markdown as string | undefined;
        const preview = markdown
          ? markdown.length > 200
            ? markdown.slice(0, 200) + "..."
            : markdown
          : "";

        outputData(
          this,
          {
            ID: data.id as string,
            Title: data.title as string,
            Subtitle: data.subtitle as string,
            Slug: data.slug as string,
            Date: formatDate(data),
            Content: preview,
          },
          data
        );
      } catch (err) {
        handleError(err);
      }
    });

  // update
  const updateCmd = (parent: Command) =>
    parent
      .command("update <id-or-slug>")
      .description("Update a post")
      .option("--title <title>", "Post title")
      .option("--text <markdown>", "Post content as markdown string")
      .option("--file <path>", "Read post content from a file")
      .option("--subtitle <subtitle>", "Post subtitle")
      .option("--tags <tags>", "Comma-separated tags")
      .action(async function (this: Command, idOrSlug: string, opts) {
        try {
          const apiKey = requireApiKey();
          const markdown = await resolveMarkdown(opts);
          await posts.updatePost(idOrSlug, {
            apiKey,
            title: opts.title,
            markdown,
            subtitle: opts.subtitle,
            tags: opts.tags
              ?.split(",")
              .map((t: string) => t.trim()),
          });
          writeSuccess(`Post updated: ${idOrSlug}`);
        } catch (err) {
          handleError(err);
        }
      });

  // delete
  const deleteCmd = (parent: Command) =>
    parent
      .command("delete <id-or-slug>")
      .description("Delete a post")
      .option("--yes", "Skip confirmation prompt (required in non-interactive mode)")
      .action(async function (this: Command, idOrSlug: string, opts) {
        try {
          if (!opts.yes) {
            if (!process.stdin.isTTY) {
              throw new Error(
                "Cannot confirm deletion in non-interactive mode. Use --yes to confirm."
              );
            }
            const ok = await confirm(`Delete post "${idOrSlug}"?`);
            if (!ok) {
              process.stderr.write("Aborted.\n");
              process.exit(2);
            }
          }
          const apiKey = requireApiKey();
          await posts.deletePost(idOrSlug, apiKey);
          writeSuccess(`Post deleted: ${idOrSlug}`);
        } catch (err) {
          handleError(err);
        }
      });

  // posts by tag
  post
    .command("by-tag <tag>")
    .description("Get posts by tag")
    .option("--limit <n>", "Max number of results (1-100)", "10")
    .option("--cursor <cursor>", "Pagination cursor from a previous request")
    .action(async function (this: Command, tag: string, opts) {
      try {
        const result = await posts.getPostsByTag(tag, {
          limit: parseInt(opts.limit, 10),
          cursor: opts.cursor,
        });
        outputTable(
          this,
          ["ID", "Title", "Date"],
          result.items.map((p) => [
            String(p.id || ""),
            String(p.title || ""),
            formatDate(p),
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

  // feed
  post
    .command("feed")
    .description("Get the curated post feed")
    .option("--limit <n>", "Max number of results (1-60)", "20")
    .option("--cursor <cursor>", "Pagination cursor from a previous request")
    .action(async function (this: Command, opts) {
      try {
        const result = await posts.getFeed({
          limit: parseInt(opts.limit, 10),
          cursor: opts.cursor,
        });
        outputTable(
          this,
          ["Title", "Publication", "Date"],
          result.items.map((item) => {
            const p = item.post as Record<string, unknown> | undefined;
            const pub = item.publication as Record<string, unknown> | undefined;
            return [
              String(p?.title || ""),
              String(pub?.name || ""),
              formatDate(p || {}),
            ];
          }),
          result.items
        );
        if (result.cursor) {
          writeInfo(`Next page: --cursor ${result.cursor}`);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // send test email
  post
    .command("test-email <id>")
    .description("Send a test newsletter email for a draft post")
    .action(async function (this: Command, id: string) {
      try {
        const apiKey = requireApiKey();
        await posts.sendTestEmail(id, apiKey);
        writeSuccess(`Test email sent for post: ${id}`);
      } catch (err) {
        handleError(err);
      }
    });

  // publish
  post
    .command("publish <id-or-slug>")
    .description("Publish a draft post")
    .option("--newsletter", "Also send as newsletter email to subscribers")
    .action(async function (this: Command, idOrSlug: string, opts) {
      try {
        const apiKey = requireApiKey();
        await posts.updatePostStatus(idOrSlug, "published", apiKey, opts.newsletter);
        writeSuccess(`Post published: ${idOrSlug}`);
      } catch (err) {
        handleError(err);
      }
    });

  // draft
  post
    .command("draft <id-or-slug>")
    .description("Revert a post to draft")
    .action(async function (this: Command, idOrSlug: string) {
      try {
        const apiKey = requireApiKey();
        await posts.updatePostStatus(idOrSlug, "draft", apiKey);
        writeSuccess(`Post reverted to draft: ${idOrSlug}`);
      } catch (err) {
        handleError(err);
      }
    });

  // archive
  post
    .command("archive <id-or-slug>")
    .description("Archive a post")
    .action(async function (this: Command, idOrSlug: string) {
      try {
        const apiKey = requireApiKey();
        await posts.updatePostStatus(idOrSlug, "archived", apiKey);
        writeSuccess(`Post archived: ${idOrSlug}`);
      } catch (err) {
        handleError(err);
      }
    });

  createCmd(post);
  updateCmd(post);
  deleteCmd(post);

  // Top-level aliases
  createCmd(program);
  updateCmd(program);
  deleteCmd(program);
}
