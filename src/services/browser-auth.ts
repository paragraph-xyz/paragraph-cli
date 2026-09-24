import * as os from "os";
import { execFile } from "child_process";
import { createClient } from "./client.js";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;
const ACK_RETRY_DELAYS_MS = [0, 250, 750];

export async function createLoginSession() {
  const client = createClient();
  const deviceName = `${os.userInfo().username}@${os.hostname()}`;
  const body = { deviceName, supportsDeliveryAcknowledgement: true };
  return client.auth.createSession(body);
}

export async function pollLoginSession(sessionId: string) {
  const client = createClient();
  return client.auth.getSession(sessionId);
}

export async function acknowledgeLoginSession(
  sessionId: string,
): Promise<boolean> {
  const client = createClient();
  for (const delayMs of ACK_RETRY_DELAYS_MS) {
    if (delayMs > 0) await sleep(delayMs);
    try {
      await client.auth.deleteSession(sessionId);
      return true;
    } catch {}
  }
  return false;
}

export async function waitForLogin(
  sessionId: string,
  signal?: AbortSignal,
): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (signal?.aborted) throw new Error("Login cancelled.");
    await sleep(POLL_INTERVAL_MS);
    if (signal?.aborted) throw new Error("Login cancelled.");
    let status;
    try {
      status = await pollLoginSession(sessionId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // A 404 means the session was denied or deleted; other errors are transient.
      if (msg.includes("404") || msg.includes("Not found")) {
        throw new Error(
          "Login was denied or expired. For non-interactive use, pass the key directly: `paragraph login --token <key>` (get one at paragraph.com/settings → Publication → Developer).",
        );
      }
      // Keep polling after a transient network error.
      continue;
    }

    if (status.status === "completed" && status.apiKey) {
      return status.apiKey;
    }
    if (status.status !== "pending") {
      throw new Error(
        "Login was denied or expired. For non-interactive use, pass the key directly: `paragraph login --token <key>` (get one at paragraph.com/settings → Publication → Developer).",
      );
    }
  }

  throw new Error(
    "Login timed out after 5 minutes. For non-interactive use, pass the key directly: `paragraph login --token <key>` (get one at paragraph.com/settings → Publication → Developer).",
  );
}

export function openBrowser(rawUrl: string): Promise<void> {
  const url = normalizeBrowserUrl(rawUrl);

  return new Promise((resolve, reject) => {
    const callback = (err: Error | null) =>
      err
        ? reject(new Error(`Failed to open browser: ${err.message}`))
        : resolve();

    if (process.platform === "win32") {
      // Pass the URL as an argument instead of sending it through a shell.
      execFile("explorer.exe", [url], callback);
    } else {
      const command = process.platform === "darwin" ? "open" : "xdg-open";
      execFile(command, [url], callback);
    }
  });
}

function normalizeBrowserUrl(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Refusing to open an invalid browser URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Refusing to open a non-HTTP browser URL.");
  }

  return url.toString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
