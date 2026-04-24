import * as fs from "fs";
import { Command } from "commander";
import { requireApiKey } from "../../services/auth.js";
import * as analytics from "../../services/analytics.js";
import {
  outputTable,
  writeInfo,
  isJsonMode,
} from "../lib/output.js";
import { handleError } from "../lib/error.js";
import { readStdin } from "../lib/stdin.js";

async function resolveSql(
  positional: string | undefined,
  opts: { sql?: string; file?: string }
): Promise<string | undefined> {
  if (opts.sql) return opts.sql;
  if (positional) return positional;
  if (opts.file) {
    if (!fs.existsSync(opts.file)) {
      throw new Error(
        `File not found: "${opts.file}". Check the path, or pass the SQL inline via --sql or as a positional argument.`
      );
    }
    return fs.readFileSync(opts.file, "utf-8");
  }
  const stdin = await readStdin();
  return stdin?.trim() || undefined;
}

function formatCell(value: unknown): string {
  if (value === null) return "NULL";
  if (value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function registerAnalyticsCommands(program: Command): void {
  const root = program
    .command("analytics")
    .description("Run SQL queries against your publication's analytics");

  root
    .command("query [sql]")
    .description(
      "Run a read-only SQL query against your publication's analytics schema"
    )
    .option("--sql <query>", "SQL query string")
    .option("--file <path>", "Read SQL from a file")
    .addHelpText(
      "after",
      `
Examples:
  $ paragraph analytics query "SELECT active_subscriber_count FROM blog_subscriber_counts"
  $ paragraph analytics query --file ./top-posts.sql
  $ cat query.sql | paragraph analytics query
  $ paragraph analytics query "SELECT title, open_rate FROM post_analytics_summary LIMIT 5" --json | jq '.rows'

Rules:
  - SELECT / WITH (CTE) statements only
  - Tables are scoped to your publication automatically
  - No semicolons; 30-second timeout; 10,000-row cap
  - Run \`paragraph analytics schema\` to discover tables and columns`
    )
    .action(async function (
      this: Command,
      positionalSql: string | undefined,
      opts
    ) {
      try {
        const apiKey = requireApiKey();
        const sql = await resolveSql(positionalSql, opts);
        if (!sql) {
          throw new Error(
            "Provide a SQL query via positional argument, --sql, --file, or pipe to stdin."
          );
        }

        const result = await analytics.runQuery(sql, apiKey);

        if (isJsonMode(this)) {
          process.stdout.write(JSON.stringify(result, null, 2) + "\n");
          return;
        }

        const headers = result.fields.map((f) => f.name);
        const rows = result.rows.map((row) =>
          headers.map((h) => formatCell((row as Record<string, unknown>)[h]))
        );
        outputTable(this, headers, rows, result.rows);

        const rowLabel = result.rowCount === 1 ? "row" : "rows";
        const truncatedSuffix = result.truncated ? " (truncated at 10,000)" : "";
        writeInfo(`${result.rowCount} ${rowLabel} returned${truncatedSuffix}`);
      } catch (err) {
        handleError(err);
      }
    });

  root
    .command("schema")
    .description(
      "List tables and columns available in your publication's analytics schema"
    )
    .addHelpText(
      "after",
      `
Examples:
  $ paragraph analytics schema
  $ paragraph analytics schema --json | jq '.tables[] | select(.table_name == "post_analytics_summary")'`
    )
    .action(async function (this: Command) {
      try {
        const apiKey = requireApiKey();
        const result = await analytics.getSchema(apiKey);

        if (isJsonMode(this)) {
          process.stdout.write(JSON.stringify(result, null, 2) + "\n");
          return;
        }

        const sorted = [...result.tables].sort((a, b) => {
          const byTable = a.table_name.localeCompare(b.table_name);
          return byTable !== 0
            ? byTable
            : a.column_name.localeCompare(b.column_name);
        });
        const headers = ["Table", "Column", "Type", "Nullable"];
        const rows = sorted.map((t) => [
          t.table_name,
          t.column_name,
          t.data_type,
          t.is_nullable,
        ]);
        outputTable(this, headers, rows, sorted);
      } catch (err) {
        handleError(err);
      }
    });
}
