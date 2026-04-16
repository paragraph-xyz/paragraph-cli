import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ParagraphApiError } from "@paragraph-com/sdk";
import { handleError } from "../src/cli/lib/error.js";

// Mock process.exit to prevent test runner from dying
const mockExit = vi.spyOn(process, "exit").mockImplementation((() => {
  throw new Error("process.exit");
}) as never);

describe("handleError", () => {
  let stderrOutput: string;
  const originalWrite = process.stderr.write;

  beforeEach(() => {
    stderrOutput = "";
    process.stderr.write = ((chunk: string) => {
      stderrOutput += chunk;
      return true;
    }) as typeof process.stderr.write;
  });

  afterEach(() => {
    process.stderr.write = originalWrite;
    mockExit.mockClear();
  });

  it("exits with code 1", () => {
    expect(() => handleError(new Error("fail"))).toThrow("process.exit");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("prints error message for plain errors", () => {
    expect(() => handleError(new Error("something broke"))).toThrow();
    expect(stderrOutput).toContain("something broke");
  });

  it("handles API errors with status codes", () => {
    const err = new ParagraphApiError(404, "Not Found", { message: "Post not found" });
    expect(() => handleError(err)).toThrow();
    expect(stderrOutput).toContain("Not found");
  });

  it("handles 401 errors", () => {
    const err = new ParagraphApiError(401, "Unauthorized", {});
    expect(() => handleError(err)).toThrow();
    expect(stderrOutput).toContain("paragraph login");
  });

  it("handles non-Error values", () => {
    expect(() => handleError("string error")).toThrow();
    expect(stderrOutput).toContain("string error");
  });
});
