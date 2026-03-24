import React from "react";
import { render } from "ink";
import { App } from "./tui/App.js";
import type { Screen } from "./tui/hooks/useNavigation.js";

export async function run(initial?: Screen) {
  const { waitUntilExit } = render(<App initial={initial} />);
  await waitUntilExit();
}
