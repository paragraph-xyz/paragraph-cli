import { ZodError } from "zod";
import { ParagraphApiError } from "@paragraph-com/sdk";
import { writeError } from "./output.js";
import { deleteConfig } from "../../services/config.js";

function isJsonMode(): boolean {
  return process.argv.includes("--json");
}

function isVerboseMode(): boolean {
  return process.argv.includes("--verbose");
}

function errorCode(status?: number): string {
  if (!status) return "UNKNOWN";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return "REQUEST_FAILED";
}

function extractError(err: unknown): { message: string; status?: number; code: string } {
  if (err instanceof ZodError) {
    const messages = err.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    return { message: "Validation failed: " + messages.join("; "), code: "VALIDATION_ERROR" };
  }
  if (err instanceof ParagraphApiError) {
    const status = err.status;
    const data = err.data as { message?: string } | undefined;
    const message = data?.message || err.message;
    if (status === 401) {
      return { message: "Unauthorized. Check your API key or run `paragraph login`.", status, code: errorCode(status) };
    } else if (status === 403) {
      return { message: "Forbidden. Your API key doesn't have access to this resource. Run `paragraph whoami --json` to verify which publication the key is for.", status, code: errorCode(status) };
    } else if (status === 404) {
      const detail = message ? `${message}. ` : "";
      return { message: `Not found. ${detail}Verify the identifier is correct — use the matching list command (e.g. \`paragraph post list --json\`, \`paragraph subscriber list --json\`) to find valid values.`, status, code: errorCode(status) };
    } else if (status === 429) {
      return { message: "Rate limited. Please wait and try again.", status, code: errorCode(status) };
    }
    return { message: message || "Request failed.", status, code: errorCode(status) };
  } else if (err instanceof Error) {
    return { message: err.message, code: "CLIENT_ERROR" };
  }
  return { message: String(err), code: "UNKNOWN" };
}

export function handleError(err: unknown): never {
  const error = extractError(err);

  if (error.status === 401) {
    deleteConfig();
  }

  if (isJsonMode()) {
    const json: Record<string, unknown> = { error: error.message, code: error.code };
    if (error.status) json.status = error.status;
    process.stderr.write(JSON.stringify(json, null, 2) + "\n");
  } else {
    writeError(error.message);
  }

  if (isVerboseMode() && err instanceof Error && err.stack) {
    process.stderr.write(err.stack + "\n");
  }

  process.exit(1);
}
