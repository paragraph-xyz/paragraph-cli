import * as fs from "fs";
import { Command } from "commander";
import { requireApiKey } from "../../services/auth.js";
import * as analytics from "../../services/analytics.js";
import { readStdin } from "../lib/stdin.js";
import {
  outputData,
  outputTable,
  writeInfo,
  isJsonMode,
} from "../lib/output.js";
import { handleError } from "../lib/error.js";

async function resolveSql(opts: {
  sql?: string;
  file?: string;
}): Promise<string | undefined> {
  if (opts.sql) return opts.sql;
  if (opts.file) {
    if (!fs.existsSync(opts.file)) {
      throw new Error(`File not found: "${opts.file}".`);
    }
    return fs.readFileSync(opts.file, "utf-8");
  }
  const stdin = await readStdin();
  return stdin || undefined;
}

export function registerAnalyticsCommands(program: Command): void {
  const cmd = program
    .command("analytics")
    .description("Query your publication's analytics data");

  cmd
    .command("query")
    .description("Run a read-only SQL query against the analytics schema")
    .option("--sql <sql>", "SQL string (SELECT or WITH only)")
    .option("--file <path>", "Read SQL from a file")
    .addHelpText("after", `
Examples:
  $ paragraph analytics query --sql "SELECT * FROM blog_subscriber_counts"
  $ paragraph analytics query --file ./query.sql
  $ paragraph analytics query --file ./query.sql --json
  $ echo "SELECT title, total_views FROM post_analytics_summary ORDER BY total_views DESC LIMIT 5" | paragraph analytics query`)
    .action(async function (this: Command, opts) {
      try {
        const sql = await resolveSql(opts);
        if (!sql) {
          throw new Error(
            "Provide SQL via --sql, --file, or pipe to stdin."
          );
        }
        const apiKey = requireApiKey();
        const result = await analytics.runQuery(sql, apiKey);

        if (isJsonMode(this)) {
          outputData(this, {}, result);
          return;
        }

        if (result.rows.length === 0) {
          writeInfo("No rows.");
          return;
        }
        const headers = result.fields.map((f) => f.name);
        const rows = result.rows.map((r) =>
          headers.map((h) => {
            const v = r[h];
            if (v === null || v === undefined) return "";
            if (typeof v === "object") return JSON.stringify(v);
            return String(v);
          })
        );
        outputTable(this, headers, rows, result.rows);
        const summary = `${result.rowCount} row${result.rowCount === 1 ? "" : "s"}${result.truncated ? " (truncated at 10,000)" : ""}`;
        writeInfo(summary);
      } catch (err) {
        handleError(err);
      }
    });

  cmd
    .command("schema")
    .description("List all tables and columns in the analytics schema")
    .option("--table <name>", "Filter to columns of a single table")
    .addHelpText("after", `
Examples:
  $ paragraph analytics schema
  $ paragraph analytics schema --table post_analytics_summary
  $ paragraph analytics schema --json`)
    .action(async function (this: Command, opts) {
      try {
        const apiKey = requireApiKey();
        const result = await analytics.getSchema(apiKey);
        const items = opts.table
          ? result.tables.filter((c) => c.table_name === opts.table)
          : result.tables;

        if (opts.table && items.length === 0) {
          throw new Error(
            `No table named "${opts.table}". Run \`paragraph analytics schema\` to list available tables.`
          );
        }

        outputTable(
          this,
          ["Table", "Column", "Type", "Nullable"],
          items.map((c) => [
            c.table_name,
            c.column_name,
            c.data_type,
            c.is_nullable,
          ]),
          items
        );
      } catch (err) {
        handleError(err);
      }
    });
}
