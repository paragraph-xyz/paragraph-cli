import { Command } from "commander";
import { searchPosts, searchBlogs } from "../../services/search.js";
import { outputTable } from "../lib/output.js";
import { handleError } from "../lib/error.js";

export function registerSearchCommands(program: Command): void {
  const search = program
    .command("search")
    .description("Search posts and blogs");

  search
    .command("post")
    .description("Search for posts")
    .requiredOption("--query <q>", "Search query")
    .addHelpText("after", `
Examples:
  $ paragraph search post --query "ethereum merge"
  $ paragraph search post --query "web3" --json | jq '.data[].post.title'`)
    .action(async function (this: Command, opts) {
      try {
        const items = await searchPosts(opts.query);
        outputTable(
          this,
          ["Title", "Publication", "Slug"],
          items.map((r) => [
            r.post.title || "",
            r.blog.name || "",
            r.post.slug || "",
          ]),
          items
        );
      } catch (err) {
        handleError(err);
      }
    });

  search
    .command("blog")
    .description("Search for blogs")
    .requiredOption("--query <q>", "Search query")
    .addHelpText("after", `
Examples:
  $ paragraph search blog --query "defi"
  $ paragraph search blog --query "nft" --json`)
    .action(async function (this: Command, opts) {
      try {
        const items = await searchBlogs(opts.query);
        outputTable(
          this,
          ["Name", "Slug", "Subscribers"],
          items.map((r) => [
            r.blog.name || "",
            r.blog.slug || "",
            String(r.activeSubscriberCount || ""),
          ]),
          items
        );
      } catch (err) {
        handleError(err);
      }
    });
}
