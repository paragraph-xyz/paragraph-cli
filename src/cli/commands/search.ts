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
    .action(async function (this: Command, opts) {
      try {
        const items = await searchPosts(opts.query);
        outputTable(
          this,
          ["Title", "Publication", "Slug"],
          items.map((r) => {
            const post = r.post as Record<string, unknown> | undefined;
            const blog = r.blog as Record<string, unknown> | undefined;
            return [
              String(post?.title || ""),
              String(blog?.name || ""),
              String(post?.slug || ""),
            ];
          }),
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
    .action(async function (this: Command, opts) {
      try {
        const items = await searchBlogs(opts.query);
        outputTable(
          this,
          ["Name", "Slug", "Subscribers"],
          items.map((r) => {
            const blog = r.blog as Record<string, unknown> | undefined;
            return [
              String(blog?.name || ""),
              String(blog?.slug || ""),
              String(r.activeSubscriberCount || ""),
            ];
          }),
          items
        );
      } catch (err) {
        handleError(err);
      }
    });
}
