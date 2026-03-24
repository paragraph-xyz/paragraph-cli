import * as os from "os";
import { execFile } from "child_process";

const API_BASE =
  process.env.PARAGRAPH_API_URL || "https://public.api.paragraph.com/api";
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

interface AuthSession {
  sessionId: string;
  verificationUrl: string;
  expiresAt: string;
}

interface AuthSessionStatus {
  status: "pending" | "completed" | "expired";
  apiKey?: string;
}

async function httpJson<T>(
  url: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { default: axios } = await import("axios");
  const res = await axios({
    url,
    method: (options.method || "GET") as "GET" | "POST",
    data: options.body,
    headers: { "Content-Type": "application/json" },
  });
  return res.data as T;
}

export async function createLoginSession(): Promise<AuthSession> {
  const deviceName = `${os.userInfo().username}@${os.hostname()}`;
  return httpJson<AuthSession>(`${API_BASE}/v1/api/auth/sessions`, {
    method: "POST",
    body: { deviceName },
  });
}

export async function pollLoginSession(
  sessionId: string
): Promise<AuthSessionStatus> {
  return httpJson<AuthSessionStatus>(
    `${API_BASE}/v1/api/auth/sessions/${sessionId}`
  );
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
