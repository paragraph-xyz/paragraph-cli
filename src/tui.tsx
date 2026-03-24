import React from "react";
import { render } from "ink";
import { App } from "./tui/App.js";
import type { Screen } from "./tui/hooks/useNavigation.js";

export async function run(initial?: Screen) {
  // Enter alternate screen buffer so long lists don't pollute scrollback
  process.stdout.write("\x1B[?1049h");
  const { waitUntilExit } = render(<App initial={initial} />);
  try {
    await waitUntilExit();
  } finally {
    // Exit alternate screen buffer, restoring the original terminal content
    process.stdout.write("\x1B[?1049l");
  }
}
