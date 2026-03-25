import { Command } from "commander";
import { getApiKey } from "../../services/auth.js";
import { resolvePublication } from "../../services/publications.js";
import { outputData } from "../lib/output.js";
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
            Name: (pub.name || pub.blogName) as string,
            Slug: (pub.slug || pub.url) as string,
            Domain: (pub.customDomain || pub.domain) as string,
            Description: (pub.description || pub.summary) as string,
          },
          pub
        );
      } catch (err) {
        handleError(err);
      }
    });
}
