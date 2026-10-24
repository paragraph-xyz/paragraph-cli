import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
vi.unmock("../src/services/client.js");
import { createProgram } from "../src/cli/program.js";

const bodyJson = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Exact words.", marks: [{ type: "bold" }] },
      ],
    },
    {
      type: "image",
      attrs: { src: "https://example.com/image.png", alt: "Blue", width: 600 },
    },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              attrs: { colspan: 2 },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Merged cell" }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe("rich newsletter commands", () => {
  let directory: string;
  let file: string;
  let requests: Array<{ method: string; body?: object }>;
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "paragraph-rich-content-"));
    file = join(directory, "body.json");
    writeFileSync(file, JSON.stringify(bodyJson));
    requests = [];
    vi.stubEnv("PARAGRAPH_API_KEY", "qa-local-test");
    vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("CLI exited");
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, options: RequestInit) => {
        requests.push({
          method: options.method!,
          body: options.body ? JSON.parse(String(options.body)) : undefined,
        });
        return Response.json({
          id: "qa-content",
          kind: "newsletter",
          title: "QA",
          status: "draft",
          body: { subject: "Exact subject", bodyJson },
        });
      }),
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    rmSync(directory, { recursive: true });
  });

  it("creates and updates the full document through the real command, service and SDK schemas", async () => {
    await createProgram().parseAsync([
      "node",
      "paragraph",
      "content",
      "create",
      "--kind",
      "newsletter",
      "--title",
      "QA",
      "--subject",
      "Exact subject",
      "--body-json-file",
      file,
      "--json",
    ]);
    await createProgram().parseAsync([
      "node",
      "paragraph",
      "content",
      "update",
      "qa-content",
      "--subject",
      "Exact subject",
      "--body-json-file",
      file,
      "--json",
    ]);
    expect(requests).toEqual([
      {
        method: "POST",
        body: {
          kind: "newsletter",
          title: "QA",
          body: { subject: "Exact subject", bodyJson },
        },
      },
      { method: "GET", body: undefined },
      {
        method: "PATCH",
        body: { body: { subject: "Exact subject", bodyJson } },
      },
    ]);
  });

  it.each([
    ["conflicting Markdown", ["--text", "Drop formatting"]],
    ["wrong content kind", ["--kind", "tweet", "--tweet", "Text"]],
  ])("refuses %s before any request", async (_label, extra) => {
    await expect(
      createProgram().parseAsync([
        "node",
        "paragraph",
        "content",
        "create",
        "--kind",
        "newsletter",
        "--title",
        "QA",
        "--subject",
        "Exact subject",
        "--body-json-file",
        file,
        ...extra,
      ]),
    ).rejects.toThrow();
    expect(requests).toEqual([]);
  });

  it("rejects malformed or non-document JSON without creating a draft", async () => {
    for (const value of [
      "{broken",
      JSON.stringify({ type: "paragraph", content: [] }),
    ]) {
      writeFileSync(file, value);
      await expect(
        createProgram().parseAsync([
          "node",
          "paragraph",
          "content",
          "create",
          "--kind",
          "newsletter",
          "--title",
          "QA",
          "--subject",
          "Exact subject",
          "--body-json-file",
          file,
        ]),
      ).rejects.toThrow();
    }
    expect(requests).toEqual([]);
  });
});
