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

export async function waitForLogin(sessionId: string): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    const status = await pollLoginSession(sessionId);

    if (status.status === "completed" && status.apiKey) {
      return status.apiKey;
    }
    if (status.status === "expired") {
      throw new Error("Login session expired. Please try again.");
    }
  }

  throw new Error("Login timed out after 5 minutes. Please try again.");
}

export function openBrowser(url: string): Promise<void> {
  return new Promise((resolve) => {
    if (process.platform === "win32") {
      execFile("cmd.exe", ["/c", "start", "", url], () => resolve());
    } else {
      const command = process.platform === "darwin" ? "open" : "xdg-open";
      execFile(command, [url], () => resolve());
    }
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
