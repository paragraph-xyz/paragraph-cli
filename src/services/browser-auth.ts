import * as os from "os";
import { execFile } from "child_process";
import { createClient } from "./client.js";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

export async function createLoginSession() {
  const client = createClient();
  const deviceName = `${os.userInfo().username}@${os.hostname()}`;
  return client.auth.createSession({ deviceName });
}

export async function pollLoginSession(sessionId: string) {
  const client = createClient();
  return client.auth.getSession(sessionId);
}

export async function waitForLogin(sessionId: string, signal?: AbortSignal): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (signal?.aborted) throw new Error("Login cancelled.");
    await sleep(POLL_INTERVAL_MS);
    if (signal?.aborted) throw new Error("Login cancelled.");
    let status;
    try {
      status = await pollLoginSession(sessionId);
    } catch {
      // Session was likely deleted (denied) — poll returns 404
      throw new Error("Login was denied or expired. Please try again.");
    }

    if (status.status === "completed" && status.apiKey) {
      return status.apiKey;
    }
    if (status.status !== "pending") {
      throw new Error("Login was denied or expired. Please try again.");
    }
  }

  throw new Error("Login timed out after 5 minutes. Please try again.");
}

export function openBrowser(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (process.platform === "win32") {
      execFile("cmd.exe", ["/c", "start", "", url], (err) =>
        err ? reject(new Error(`Failed to open browser: ${err.message}`)) : resolve()
      );
    } else {
      const command = process.platform === "darwin" ? "open" : "xdg-open";
      execFile(command, [url], (err) =>
        err ? reject(new Error(`Failed to open browser: ${err.message}`)) : resolve()
      );
    }
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
