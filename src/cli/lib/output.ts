import { Command } from "commander";
import pc from "picocolors";
import Table from "cli-table3";

export function isJsonMode(cmd: Command): boolean {
  return cmd.optsWithGlobals().json === true;
}

export function outputData(
  cmd: Command,
  data: Record<string, unknown>,
  rawData?: unknown
): void {
  if (isJsonMode(cmd)) {
    process.stdout.write(JSON.stringify(rawData || data, null, 2) + "\n");
    return;
  }
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== "") {
      process.stderr.write(`${pc.bold(key)}: ${value}\n`);
    }
  }
}

export function outputTable(
  cmd: Command,
  headers: string[],
  rows: string[][],
  rawData: unknown[],
  pagination?: { cursor?: string }
): void {
  if (isJsonMode(cmd)) {
    const output: Record<string, unknown> = { data: rawData };
    if (pagination?.cursor) {
      output.pagination = { cursor: pagination.cursor, hasMore: true };
    } else {
      output.pagination = { hasMore: false };
    }
    process.stdout.write(JSON.stringify(output, null, 2) + "\n");
    return;
  }
  if (rows.length === 0) {
    writeInfo("No results found.");
    return;
  }
  const table = new Table({ head: headers.map((h) => pc.bold(h)) });
  for (const row of rows) {
    table.push(row);
  }
  process.stderr.write(table.toString() + "\n");
}

export function writeInfo(text: string): void {
  process.stderr.write(text + "\n");
}

export function writeError(text: string): void {
  process.stderr.write(pc.red("Error: " + text) + "\n");
}

export function writeSuccess(text: string): void {
  process.stderr.write(pc.green("✓ " + text) + "\n");
}

export function parseLimit(value: string, max = 100): number {
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 1) return 1;
  return Math.min(n, max);
}
