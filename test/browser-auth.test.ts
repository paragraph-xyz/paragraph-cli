import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  execFile: vi.fn(),
}));

vi.mock("child_process", () => ({
  execFile: mocks.execFile,
}));

vi.mock("../src/services/client.js", () => ({
  createClient: () => ({
    auth: {
      createSession: mocks.createSession,
      deleteSession: mocks.deleteSession,
    },
  }),
}));

import {
  acknowledgeLoginSession,
  createLoginSession,
  openBrowser,
} from "../src/services/browser-auth.js";

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  mocks.execFile.mockImplementation(
    (_command: string, _args: string[], callback: (error: null) => void) =>
      callback(null),
  );
});

describe("browser login acknowledgement", () => {
  it("requests retryable delivery for browser login", async () => {
    mocks.createSession.mockResolvedValue({ sessionId: "session-1" });

    await createLoginSession();

    expect(mocks.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ supportsDeliveryAcknowledgement: true })
    );
  });

  it("acknowledges a stored credential with the session id", async () => {
    mocks.deleteSession.mockResolvedValue({ success: true });

    await expect(acknowledgeLoginSession("session-1")).resolves.toBe(true);

    expect(mocks.deleteSession).toHaveBeenCalledExactlyOnceWith("session-1");
  });

  it("retries a transient acknowledgement failure", async () => {
    vi.useFakeTimers();
    mocks.deleteSession
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValue({ success: true });

    const acknowledgement = acknowledgeLoginSession("session-1");
    await vi.runAllTimersAsync();

    await expect(acknowledgement).resolves.toBe(true);
    expect(mocks.deleteSession).toHaveBeenCalledTimes(2);
  });

  it("does not fail login when acknowledgement remains unavailable", async () => {
    vi.useFakeTimers();
    mocks.deleteSession.mockRejectedValue(new Error("network unavailable"));

    const acknowledgement = acknowledgeLoginSession("session-1");
    await vi.runAllTimersAsync();

    await expect(acknowledgement).resolves.toBe(false);
    expect(mocks.deleteSession).toHaveBeenCalledTimes(3);
  });

  it("rejects non-HTTP URLs before attempting to open them", () => {
    expect(() => openBrowser("javascript:alert(1)")).toThrow(
      "Refusing to open a non-HTTP browser URL.",
    );
    expect(mocks.execFile).not.toHaveBeenCalled();
  });

  it("opens validated HTTP URLs through the platform launcher", async () => {
    await expect(openBrowser("https://example.com/login?state=a&b=c")).resolves.toBeUndefined();
    expect(mocks.execFile).toHaveBeenCalledWith(
      expect.any(String),
      ["https://example.com/login?state=a&b=c"],
      expect.any(Function),
    );
  });
});
