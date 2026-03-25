import * as fs from "fs";
import { Command } from "commander";
import { getApiKey, requireApiKey } from "../../services/auth.js";
import * as posts from "../../services/posts.js";
import { outputData, outputTable, writeSuccess, writeInfo, parseLimit } from "../lib/output.js";
import { handleError } from "../lib/error.js";
import { readStdin } from "../lib/stdin.js";
import { confirm } from "../lib/prompt.js";
import { requireArg, formatDate } from "../lib/args.js";

async function resolveMarkdown(opts: {
  text?: string;
  file?: string;
}): Promise<string | undefined> {
  if (opts.text) return opts.text;
  if (opts.file) {
    if (!fs.existsSync(opts.file)) {
      throw new Error(`File not found: ${opts.file}`);
    }
    return fs.readFileSync(opts.file, "utf-8");
  }
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
      .addHelpText("after", `
Examples:
  $ paragraph post create --title "My Post" --file ./post.md
  $ paragraph post create --title "My Post" --text "# Hello World"
  $ paragraph post create --title "My Post" --tags "web3,defi" --file ./post.md
  $ cat draft.md | paragraph post create --title "My Post"`)
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
    .addHelpText("after", `
Examples:
  $ paragraph post list
  $ paragraph post list --status draft --limit 20
  $ paragraph post list --publication my-blog --limit 5
  $ paragraph post list --json | jq '.data[].id'
  $ paragraph post list --cursor <cursor-from-previous>`)
    .action(async function (this: Command, opts) {
      try {
        const apiKey = opts.publication ? getApiKey() : requireApiKey();
        const result = await posts.listPosts({
          apiKey,
          publicationId: opts.publication,
          status: opts.status,
          limit: parseLimit(opts.limit),
          cursor: opts.cursor,
        });

        const headers = ["ID", "Title", "Date"];
        const rows = result.items.map((p) => [
          String(p.id || ""),
          String(p.title || ""),
          formatDate(p),
        ]);

        outputTable(this, headers, rows, result.items, { cursor: result.cursor });
        if (result.cursor) {
          writeInfo(`Next page: --cursor ${result.cursor}`);
        }
      } catch (err) {
        handleError(err);
      }
    });

  // get
  post
    .command("get [identifier]")
    .description("Get a post by ID, URL, or @publication/slug")
    .option("--id <identifier>", "Post ID, URL, or @publication/slug")
    .option("--field <name>", "Output a single field value (e.g., markdown, title)")
    .addHelpText("after", `
Examples:
  $ paragraph post get abc123
  $ paragraph post get --id abc123
  $ paragraph post get @my-blog/my-post
  $ paragraph post get https://paragraph.com/@my-blog/my-post
  $ paragraph post get abc123 --field markdown > post.md
  $ paragraph post get abc123 --json | jq '.title'`)
    .action(async function (this: Command, identifier: string | undefined, opts) {
      try {
        const id = requireArg(identifier, opts.id, "identifier");
        const data = await posts.resolvePost(id, getApiKey());

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
      .command("update [id-or-slug]")
      .description("Update a post")
      .option("--id <id-or-slug>", "Post ID or slug")
      .option("--title <title>", "Post title")
      .option("--text <markdown>", "Post content as markdown string")
      .option("--file <path>", "Read post content from a file")
      .option("--subtitle <subtitle>", "Post subtitle")
      .option("--tags <tags>", "Comma-separated tags")
      .addHelpText("after", `
Examples:
  $ paragraph post update my-post --title "New Title"
  $ paragraph post update --id my-post --title "New Title"
  $ paragraph post update my-post --file ./updated.md
  $ cat updated.md | paragraph post update my-post
  $ paragraph post update my-post --tags "web3,defi" --json`)
      .action(async function (this: Command, idOrSlug: string | undefined, opts) {
        try {
          const id = requireArg(idOrSlug, opts.id, "post ID or slug");
          const apiKey = requireApiKey();
          const markdown = await resolveMarkdown(opts);
          if (!opts.title && !opts.subtitle && !markdown && !opts.tags) {
            throw new Error("Nothing to update. Provide --title, --subtitle, --text, --file, or --tags.");
          }
          await posts.updatePost(id, {
            apiKey,
            title: opts.title,
            markdown,
            subtitle: opts.subtitle,
            tags: opts.tags
              ?.split(",")
              .map((t: string) => t.trim()),
          });
          writeSuccess(`Post updated: ${id}`);
          const result: Record<string, unknown> = { id, updated: true };
          if (opts.title) result.title = opts.title;
          if (opts.subtitle) result.subtitle = opts.subtitle;
          outputData(this, { ID: id }, result);
        } catch (err) {
          handleError(err);
        }
      });

  // delete
  const deleteCmd = (parent: Command) =>
    parent
      .command("delete [id-or-slug]")
      .description("Delete a post")
      .option("--id <id-or-slug>", "Post ID or slug")
      .option("--yes", "Skip confirmation prompt")
      .option("--dry-run", "Preview what would be deleted without deleting")
      .addHelpText("after", `
Examples:
  $ paragraph post delete my-post
  $ paragraph post delete --id my-post
  $ paragraph post delete my-post --yes
  $ paragraph post delete my-post --dry-run
  $ paragraph post delete my-post --json --yes`)
      .action(async function (this: Command, idOrSlug: string | undefined, opts) {
        try {
          const id = requireArg(idOrSlug, opts.id, "post ID or slug");

          if (opts.dryRun) {
            const apiKey = requireApiKey();
            const data = await posts.resolveOwnPost(id, apiKey);
            writeInfo(`Would delete post: ${data.title || id}`);
            outputData(
              this,
              {
                ID: (data.id || id) as string,
                Title: data.title as string,
                Slug: (data.slug || id) as string,
                Action: "delete (dry-run)",
              },
              { ...data, dryRun: true }
            );
            return;
          }

          if (!opts.yes) {
            if (!process.stdin.isTTY) {
              throw new Error(
                "Cannot confirm deletion in non-interactive mode. Use --yes to confirm."
              );
            }
            const ok = await confirm(`Delete post "${id}"?`);
            if (!ok) {
              process.stderr.write("Aborted.\n");
              process.exit(1);
            }
          }
          const apiKey = requireApiKey();
          await posts.deletePost(id, apiKey);
          writeSuccess(`Post deleted: ${id}`);
          outputData(this, { ID: id, Status: "deleted" }, { id, deleted: true });
        } catch (err) {
          handleError(err);
        }
      });

  // posts by tag
  post
    .command("by-tag [tag]")
    .description("Get posts by tag")
    .option("--tag <tag>", "Tag to filter by")
    .option("--limit <n>", "Max number of results (1-100)", "10")
    .option("--cursor <cursor>", "Pagination cursor from a previous request")
    .addHelpText("after", `
Examples:
  $ paragraph post by-tag web3
  $ paragraph post by-tag --tag web3
  $ paragraph post by-tag defi --limit 20 --json`)
    .action(async function (this: Command, positionalTag: string | undefined, opts) {
      try {
        const tag = requireArg(positionalTag, opts.tag, "tag", "--tag");
        const result = await posts.getPostsByTag(tag, {
          limit: parseLimit(opts.limit),
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

  // feed
  post
    .command("feed")
    .description("Get the curated post feed")
    .option("--limit <n>", "Max number of results (1-60)", "20")
    .option("--cursor <cursor>", "Pagination cursor from a previous request")
    .addHelpText("after", `
Examples:
  $ paragraph post feed
  $ paragraph post feed --limit 5
  $ paragraph post feed --json | jq '.data[].post.title'`)
    .action(async function (this: Command, opts) {
      try {
        const result = await posts.getFeed({
          limit: parseLimit(opts.limit, 60),
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

  // send test email
  post
    .command("test-email [id]")
    .description("Send a test newsletter email for a draft post")
    .option("--id <id>", "Post ID")
    .addHelpText("after", `
Examples:
  $ paragraph post test-email abc123
  $ paragraph post test-email --id abc123`)
    .action(async function (this: Command, positionalId: string | undefined, opts) {
      try {
        const id = requireArg(positionalId, opts.id, "post ID");
        const apiKey = requireApiKey();
        await posts.sendTestEmail(id, apiKey);
        writeSuccess(`Test email sent for post: ${id}`);
        outputData(this, { ID: id, Status: "sent" }, { id, testEmailSent: true });
      } catch (err) {
        handleError(err);
      }
    });

  // publish
  post
    .command("publish [id-or-slug]")
    .description("Publish a draft post")
    .option("--id <id-or-slug>", "Post ID or slug")
    .option("--newsletter", "Also send as newsletter email to subscribers")
    .option("--dry-run", "Preview what would be published without publishing")
    .addHelpText("after", `
Examples:
  $ paragraph post publish my-post
  $ paragraph post publish --id my-post
  $ paragraph post publish my-post --newsletter
  $ paragraph post publish my-post --dry-run
  $ paragraph post publish my-post --json`)
    .action(async function (this: Command, idOrSlug: string | undefined, opts) {
      try {
        const id = requireArg(idOrSlug, opts.id, "post ID or slug");

        if (opts.dryRun) {
          const apiKey = requireApiKey();
          const data = await posts.resolveOwnPost(id, apiKey);
          writeInfo(`Would publish post: ${data.title || id}`);
          outputData(
            this,
            {
              ID: (data.id || id) as string,
              Title: data.title as string,
              Slug: (data.slug || id) as string,
              Newsletter: opts.newsletter ? "yes" : "no",
              Action: "publish (dry-run)",
            },
            { ...data, dryRun: true, newsletter: !!opts.newsletter }
          );
          return;
        }

        const apiKey = requireApiKey();
        await posts.updatePostStatus(id, "published", apiKey, opts.newsletter);
        writeSuccess(`Post published: ${id}`);
        outputData(this, { ID: id, Status: "published" }, { id, status: "published" });
      } catch (err) {
        handleError(err);
      }
    });

  // draft
  post
    .command("draft [id-or-slug]")
    .description("Revert a post to draft")
    .option("--id <id-or-slug>", "Post ID or slug")
    .addHelpText("after", `
Examples:
  $ paragraph post draft my-post
  $ paragraph post draft --id my-post
  $ paragraph post draft my-post --json`)
    .action(async function (this: Command, idOrSlug: string | undefined, opts) {
      try {
        const id = requireArg(idOrSlug, opts.id, "post ID or slug");
        const apiKey = requireApiKey();
        await posts.updatePostStatus(id, "draft", apiKey);
        writeSuccess(`Post reverted to draft: ${id}`);
        outputData(this, { ID: id, Status: "draft" }, { id, status: "draft" });
      } catch (err) {
        handleError(err);
      }
    });

  // archive
  post
    .command("archive [id-or-slug]")
    .description("Archive a post")
    .option("--id <id-or-slug>", "Post ID or slug")
    .option("--dry-run", "Preview what would be archived without archiving")
    .addHelpText("after", `
Examples:
  $ paragraph post archive my-post
  $ paragraph post archive --id my-post
  $ paragraph post archive my-post --dry-run
  $ paragraph post archive my-post --json`)
    .action(async function (this: Command, idOrSlug: string | undefined, opts) {
      try {
        const id = requireArg(idOrSlug, opts.id, "post ID or slug");

        if (opts.dryRun) {
          const apiKey = requireApiKey();
          const data = await posts.resolveOwnPost(id, apiKey);
          writeInfo(`Would archive post: ${data.title || id}`);
          outputData(
            this,
            {
              ID: (data.id || id) as string,
              Title: data.title as string,
              Slug: (data.slug || id) as string,
              Action: "archive (dry-run)",
            },
            { ...data, dryRun: true }
          );
          return;
        }

        const apiKey = requireApiKey();
        await posts.updatePostStatus(id, "archived", apiKey);
        writeSuccess(`Post archived: ${id}`);
        outputData(this, { ID: id, Status: "archived" }, { id, status: "archived" });
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
