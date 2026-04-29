import * as fs from "fs";
import { Command } from "commander";
import type { UpdatePublicationBody } from "@paragraph-com/sdk";
import { getApiKey, requireApiKey } from "../../services/auth.js";
import {
  resolvePublication,
  updatePublication,
} from "../../services/publications.js";
import { outputData, writeSuccess } from "../lib/output.js";
import { handleError } from "../lib/error.js";
import { requireArg } from "../lib/args.js";

export function registerPublicationCommands(program: Command): void {
  const publication = program
    .command("publication")
    .description("Manage publications");

  publication
    .command("get [identifier]")
    .description("Get publication details by ID, slug, or domain")
    .option("--id <identifier>", "Publication ID, slug, or domain")
    .addHelpText("after", `
Examples:
  $ paragraph publication get my-blog
  $ paragraph publication get --id my-blog
  $ paragraph publication get my-blog --json`)
    .action(async function (this: Command, identifier: string | undefined, opts) {
      try {
        const id = requireArg(identifier, opts.id, "identifier");
        const pub = await resolvePublication(id, getApiKey());
        outputData(
          this,
          {
            Name: pub.name,
            Slug: pub.slug,
            Domain: pub.customDomain,
            Description: pub.summary,
          },
          pub
        );
      } catch (err) {
        handleError(err);
      }
    });

  publication
    .command("update [publication-id]")
    .description("Update publication settings (only provided fields are changed)")
    .option("--id <id>", "Publication ID")
    .option("--from-json <file>", "Read the full update body from a JSON file (merged with explicit flags; flags win)")
    .option("--name <name>", "Display name")
    .option("--summary <summary>", "Brief description (max 500 chars)")
    .option("--theme-color <color>", "Theme accent color (e.g. 'purple-600', 'default')")
    .option("--header-font <font>", "Header font: default | serif | mono")
    .option("--body-font <font>", "Body font: default | serif | mono")
    .option("--post-list-type <type>", "Homepage layout: feed | grid | full-post")
    .option("--featured-post <selector>", "Post ID, or 'latest' | 'popular' | 'disabled'")
    .option("--pinned-post-ids <ids>", "Comma-separated post IDs to pin (max 50, replaces existing list)")
    .option("--disable-comments <value>", "Comment visibility: true | false | on-platform")
    .option(
      "--email-notifications <pairs>",
      "Owner email toggles as key=value,... (keys: newComment, newSubscriber, newPaidSubscriber, newContentCollected)"
    )
    .addHelpText("after", `
Examples:
  $ paragraph publication update abc123 --name "My Blog" --theme-color purple-600
  $ paragraph publication update abc123 --featured-post latest
  $ paragraph publication update abc123 --pinned-post-ids id1,id2,id3
  $ paragraph publication update abc123 --disable-comments on-platform
  $ paragraph publication update abc123 --email-notifications newSubscriber=true,newComment=false
  $ paragraph publication update abc123 --from-json ./settings.json
  $ paragraph publication update abc123 --from-json ./base.json --name "Override Name"`)
    .action(async function (
      this: Command,
      positionalId: string | undefined,
      opts
    ) {
      try {
        const id = requireArg(positionalId, opts.id, "publication ID");
        const apiKey = requireApiKey();
        const body: UpdatePublicationBody = {};

        if (opts.fromJson) {
          if (!fs.existsSync(opts.fromJson)) {
            throw new Error(`File not found: "${opts.fromJson}".`);
          }
          const parsed = JSON.parse(fs.readFileSync(opts.fromJson, "utf-8"));
          Object.assign(body, parsed);
        }

        if (opts.name !== undefined) body.name = opts.name;
        if (opts.summary !== undefined) body.summary = opts.summary;
        if (opts.themeColor !== undefined)
          body.themeColor = opts.themeColor;
        if (opts.headerFont !== undefined)
          body.headerFont = opts.headerFont;
        if (opts.bodyFont !== undefined) body.bodyFont = opts.bodyFont;
        if (opts.postListType !== undefined)
          body.postListType = opts.postListType;
        if (opts.featuredPost !== undefined)
          body.featuredPost = opts.featuredPost;

        if (opts.pinnedPostIds !== undefined) {
          const ids = opts.pinnedPostIds
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean);
          if (ids.length > 50) {
            throw new Error(
              `--pinned-post-ids accepts at most 50 IDs (got ${ids.length}).`
            );
          }
          body.pinnedPostIds = ids;
        }

        if (opts.disableComments !== undefined) {
          const v = opts.disableComments;
          if (v === "true") body.disableComments = true;
          else if (v === "false") body.disableComments = false;
          else if (v === "on-platform") body.disableComments = "on-platform";
          else
            throw new Error(
              `--disable-comments must be 'true', 'false', or 'on-platform' (got "${v}").`
            );
        }

        if (opts.emailNotifications !== undefined) {
          const pairs = opts.emailNotifications
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean);
          const allowed = new Set([
            "newComment",
            "newSubscriber",
            "newPaidSubscriber",
            "newContentCollected",
          ]);
          const out: Record<string, boolean> = {};
          for (const pair of pairs) {
            const [key, value] = pair.split("=");
            if (!allowed.has(key)) {
              throw new Error(
                `--email-notifications: unknown key "${key}". Allowed: newComment, newSubscriber, newPaidSubscriber, newContentCollected.`
              );
            }
            if (value !== "true" && value !== "false") {
              throw new Error(
                `--email-notifications: value for "${key}" must be 'true' or 'false' (got "${value}").`
              );
            }
            out[key] = value === "true";
          }
          body.emailNotifications = out;
        }

        if (Object.keys(body).length === 0) {
          throw new Error(
            "Nothing to update. Provide at least one field flag, or pass --from-json <file>."
          );
        }

        const updated = await updatePublication(id, body, apiKey);
        writeSuccess(`Publication updated: ${updated.name}`);
        outputData(
          this,
          {
            ID: updated.id,
            Name: updated.name,
            Slug: updated.slug,
            Theme: updated.themeColor,
            "Pinned posts": updated.pinnedPostIds?.length ?? 0,
          },
          updated
        );
      } catch (err) {
        handleError(err);
      }
    });
}
