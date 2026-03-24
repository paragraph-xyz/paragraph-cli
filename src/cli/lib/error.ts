import { writeError } from "./output.js";
import { deleteConfig } from "../../services/config.js";

function isAxiosError(
  err: unknown
): err is {
  response?: { status?: number; data?: { message?: string } };
  message?: string;
} {
  return (
    typeof err === "object" &&
    err !== null &&
    "isAxiosError" in err &&
    (err as Record<string, unknown>).isAxiosError === true
  );
}

function isJsonMode(): boolean {
  return process.argv.includes("--json");
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
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message;
    if (status === 401) {
      return { message: "Unauthorized. Check your API key or run `paragraph login`.", status, code: errorCode(status) };
    } else if (status === 404) {
      return { message: "Not found. " + (message || ""), status, code: errorCode(status) };
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

  process.exit(1);
}
