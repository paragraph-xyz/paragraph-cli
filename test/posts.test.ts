import { describe, it, expect } from "vitest";
import { isSlug } from "../src/services/posts.js";

describe("isSlug", () => {
  it("accepts valid slugs", () => {
    expect(isSlug("my-post")).toBe(true);
    expect(isSlug("hello")).toBe(true);
    expect(isSlug("post-123")).toBe(true);
    expect(isSlug("a")).toBe(true);
  });

  it("rejects invalid slugs", () => {
    expect(isSlug("My-Post")).toBe(false);
    expect(isSlug("-leading-dash")).toBe(false);
    expect(isSlug("trailing-dash-")).toBe(false);
    expect(isSlug("has spaces")).toBe(false);
    expect(isSlug("")).toBe(false);
    expect(isSlug("UPPER")).toBe(false);
  });

  it("rejects URLs and @-prefixed slugs", () => {
    expect(isSlug("https://example.com")).toBe(false);
    expect(isSlug("@pub/post")).toBe(false);
  });
});
