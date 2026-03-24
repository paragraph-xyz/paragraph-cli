import { writeError } from "./output.js";

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

function extractError(err: unknown): { message: string; status?: number } {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message;
    if (status === 401) {
      return { message: "Unauthorized. Check your API key or run `paragraph login`.", status };
    } else if (status === 404) {
      return { message: "Not found. " + (message || ""), status };
    } else if (status === 429) {
      return { message: "Rate limited. Please wait and try again.", status };
    }
    return { message: message || "Request failed.", status };
  } else if (err instanceof Error) {
    return { message: err.message };
  }
  return { message: String(err) };
}

export function handleError(err: unknown): never {
  const error = extractError(err);

  if (isJsonMode()) {
    const json: Record<string, unknown> = { error: error.message };
    if (error.status) json.status = error.status;
    process.stdout.write(JSON.stringify(json, null, 2) + "\n");
  } else {
    writeError(error.message);
  }

  process.exit(1);
}
