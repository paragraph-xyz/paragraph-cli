import { beforeEach, describe, expect, it, vi } from "vitest";

const acknowledgeLoginSession = vi.hoisted(() => vi.fn());

vi.mock("../src/services/browser-auth.js", () => ({
  acknowledgeLoginSession,
  createLoginSession: vi.fn(),
  openBrowser: vi.fn(),
  waitForLogin: vi.fn(),
}));

import { completeBrowserLogin } from "../src/tui/screens/Login.js";

beforeEach(() => {
  vi.clearAllMocks();
  acknowledgeLoginSession.mockResolvedValue(true);
});

describe("TUI browser login completion", () => {
  it("acknowledges only after validation and storage succeed", async () => {
    const login = vi.fn().mockResolvedValue({ name: "Publication" });

    await expect(
      completeBrowserLogin("session-1", "para_secret", login)
    ).resolves.toEqual({ name: "Publication" });

    expect(login).toHaveBeenCalledWith("para_secret");
    expect(acknowledgeLoginSession).toHaveBeenCalledWith("session-1");
    expect(login.mock.invocationCallOrder[0]).toBeLessThan(
      acknowledgeLoginSession.mock.invocationCallOrder[0]
    );
  });

  it("does not acknowledge when validation or storage fails", async () => {
    const login = vi.fn().mockRejectedValue(new Error("storage failed"));

    await expect(
      completeBrowserLogin("session-1", "para_secret", login)
    ).rejects.toThrow("storage failed");

    expect(acknowledgeLoginSession).not.toHaveBeenCalled();
  });
});
