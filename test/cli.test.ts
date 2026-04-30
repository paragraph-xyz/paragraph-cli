import { describe, it, expect, beforeEach } from "vitest";
import { createProgram } from "../src/cli/program.js";
import type { Command } from "commander";

function parseArgs(program: Command, args: string[]) {
  return program.parseAsync(["node", "paragraph", ...args]);
}

describe("CLI program", () => {
  let program: Command;

  beforeEach(() => {
    program = createProgram();
  });

  it("has the correct name", () => {
    expect(program.name()).toBe("paragraph");
  });

  it("registers all top-level commands", () => {
    const names = program.commands.map((c) => c.name());
    expect(names).toContain("login");
    expect(names).toContain("logout");
    expect(names).toContain("whoami");
    expect(names).toContain("post");
    expect(names).toContain("publication");
    expect(names).toContain("search");
    expect(names).toContain("subscriber");
    expect(names).toContain("coin");
    expect(names).toContain("user");
    expect(names).toContain("analytics");
    expect(names).toContain("email");
  });

  it("registers top-level aliases for create, update, delete", () => {
    const names = program.commands.map((c) => c.name());
    expect(names).toContain("create");
    expect(names).toContain("update");
    expect(names).toContain("delete");
  });

  it("has global --json flag", () => {
    const opts = program.options.map((o) => o.long);
    expect(opts).toContain("--json");
  });

  it("has global --verbose flag", () => {
    const opts = program.options.map((o) => o.long);
    expect(opts).toContain("--verbose");
  });

  describe("post subcommands", () => {
    it("registers all post subcommands", () => {
      const post = program.commands.find((c) => c.name() === "post")!;
      const names = post.commands.map((c) => c.name());
      expect(names).toContain("create");
      expect(names).toContain("list");
      expect(names).toContain("get");
      expect(names).toContain("update");
      expect(names).toContain("delete");
      expect(names).toContain("by-tag");
      expect(names).toContain("feed");
      expect(names).toContain("test-email");
      expect(names).toContain("publish");
      expect(names).toContain("draft");
      expect(names).toContain("archive");
    });

    it("post delete has --yes, --dry-run, and --id flags", () => {
      const post = program.commands.find((c) => c.name() === "post")!;
      const del = post.commands.find((c) => c.name() === "delete")!;
      const opts = del.options.map((o) => o.long);
      expect(opts).toContain("--yes");
      expect(opts).toContain("--dry-run");
      expect(opts).toContain("--id");
    });

    it("post publish has --dry-run and --id flags", () => {
      const post = program.commands.find((c) => c.name() === "post")!;
      const publish = post.commands.find((c) => c.name() === "publish")!;
      const opts = publish.options.map((o) => o.long);
      expect(opts).toContain("--dry-run");
      expect(opts).toContain("--id");
      expect(opts).toContain("--newsletter");
    });

    it("post archive has --dry-run and --id flags", () => {
      const post = program.commands.find((c) => c.name() === "post")!;
      const archive = post.commands.find((c) => c.name() === "archive")!;
      const opts = archive.options.map((o) => o.long);
      expect(opts).toContain("--dry-run");
      expect(opts).toContain("--id");
    });

    it("post get accepts optional positional and --id flag", () => {
      const post = program.commands.find((c) => c.name() === "post")!;
      const get = post.commands.find((c) => c.name() === "get")!;
      const opts = get.options.map((o) => o.long);
      expect(opts).toContain("--id");
      expect(opts).toContain("--field");
    });
  });

  describe("subscriber subcommands", () => {
    it("subscriber count accepts --publication flag", () => {
      const sub = program.commands.find((c) => c.name() === "subscriber")!;
      const count = sub.commands.find((c) => c.name() === "count")!;
      const opts = count.options.map((o) => o.long);
      expect(opts).toContain("--publication");
    });

    it("registers subscriber remove with --email, --wallet, --yes", () => {
      const sub = program.commands.find((c) => c.name() === "subscriber")!;
      const remove = sub.commands.find((c) => c.name() === "remove")!;
      expect(remove).toBeDefined();
      const opts = remove.options.map((o) => o.long);
      expect(opts).toContain("--email");
      expect(opts).toContain("--wallet");
      expect(opts).toContain("--yes");
    });
  });

  describe("publication subcommands", () => {
    it("registers publication update with key flags", () => {
      const pub = program.commands.find((c) => c.name() === "publication")!;
      const update = pub.commands.find((c) => c.name() === "update")!;
      expect(update).toBeDefined();
      const opts = update.options.map((o) => o.long);
      expect(opts).toContain("--from-json");
      expect(opts).toContain("--name");
      expect(opts).toContain("--featured-post");
      expect(opts).toContain("--pinned-post-ids");
      expect(opts).toContain("--disable-comments");
      expect(opts).toContain("--email-notifications");
    });
  });

  describe("analytics subcommands", () => {
    it("registers analytics query and schema", () => {
      const analytics = program.commands.find((c) => c.name() === "analytics")!;
      const names = analytics.commands.map((c) => c.name());
      expect(names).toContain("query");
      expect(names).toContain("schema");
    });

    it("analytics query accepts --sql and --file", () => {
      const analytics = program.commands.find((c) => c.name() === "analytics")!;
      const query = analytics.commands.find((c) => c.name() === "query")!;
      const opts = query.options.map((o) => o.long);
      expect(opts).toContain("--sql");
      expect(opts).toContain("--file");
    });

    it("analytics schema accepts --table", () => {
      const analytics = program.commands.find((c) => c.name() === "analytics")!;
      const schema = analytics.commands.find((c) => c.name() === "schema")!;
      const opts = schema.options.map((o) => o.long);
      expect(opts).toContain("--table");
    });
  });

  describe("email subcommands", () => {
    it("registers email send", () => {
      const email = program.commands.find((c) => c.name() === "email")!;
      const names = email.commands.map((c) => c.name());
      expect(names).toContain("send");
    });

    it("email send has --subject, --body, --body-file, --to, --dry-run, --yes", () => {
      const email = program.commands.find((c) => c.name() === "email")!;
      const send = email.commands.find((c) => c.name() === "send")!;
      const opts = send.options.map((o) => o.long);
      expect(opts).toContain("--subject");
      expect(opts).toContain("--body");
      expect(opts).toContain("--body-file");
      expect(opts).toContain("--to");
      expect(opts).toContain("--dry-run");
      expect(opts).toContain("--yes");
    });
  });

  describe("post update --published-at", () => {
    it("post update accepts --published-at", () => {
      const post = program.commands.find((c) => c.name() === "post")!;
      const update = post.commands.find((c) => c.name() === "update")!;
      const opts = update.options.map((o) => o.long);
      expect(opts).toContain("--published-at");
    });
  });

  describe("coin subcommands", () => {
    it("coin get accepts --id flag", () => {
      const coin = program.commands.find((c) => c.name() === "coin")!;
      const get = coin.commands.find((c) => c.name() === "get")!;
      const opts = get.options.map((o) => o.long);
      expect(opts).toContain("--id");
    });
  });

  describe("--help includes examples via addHelpText", () => {
    it("post create has afterHelp text registered", () => {
      const post = program.commands.find((c) => c.name() === "post")!;
      const create = post.commands.find((c) => c.name() === "create")!;
      // addHelpText("after", ...) stores callbacks; verify the command has help text
      // by capturing the full rendered output
      let output = "";
      create.configureOutput({ writeOut: (str) => { output += str; } });
      create.outputHelp();
      expect(output).toContain("Examples:");
      expect(output).toContain("paragraph post create");
    });

    it("login has afterHelp text registered", () => {
      const login = program.commands.find((c) => c.name() === "login")!;
      let output = "";
      login.configureOutput({ writeOut: (str) => { output += str; } });
      login.outputHelp();
      expect(output).toContain("Examples:");
      expect(output).toContain("paragraph login");
    });
  });
});
