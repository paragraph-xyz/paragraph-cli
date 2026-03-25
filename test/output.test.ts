import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseLimit } from "../src/cli/lib/output.js";

describe("parseLimit", () => {
  it("parses valid numbers", () => {
    expect(parseLimit("10")).toBe(10);
    expect(parseLimit("1")).toBe(1);
    expect(parseLimit("50")).toBe(50);
  });

  it("clamps to max", () => {
    expect(parseLimit("200")).toBe(100);
    expect(parseLimit("999", 50)).toBe(50);
  });

  it("returns 1 for invalid input", () => {
    expect(parseLimit("abc")).toBe(1);
    expect(parseLimit("-5")).toBe(1);
    expect(parseLimit("0")).toBe(1);
  });
});
