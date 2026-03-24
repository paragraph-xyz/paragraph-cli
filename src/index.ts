const args = process.argv.slice(2);
const hasJson = args.includes("--json");
const hasHelp = args.includes("--help") || args.includes("-h");
const hasVersion = args.includes("--version") || args.includes("-v");
const bareInvocation = args.length === 0 || (args.length === 1 && args[0] === "");
const isLoginCommand = args[0] === "login" && !hasJson;

const forceNonInteractive =
  hasJson ||
  hasHelp ||
  hasVersion ||
  !process.stdout.isTTY ||
  process.env.CI === "true" ||
  process.env.PARAGRAPH_NON_INTERACTIVE === "1";

if (forceNonInteractive || (!bareInvocation && !isLoginCommand)) {
  // CLI path: Commander, no React loaded
  import("./cli.js").then((m) => m.run());
} else if (isLoginCommand) {
  // TUI login
  import("./tui.js").then((m) => m.run({ name: "login" }));
} else {
  // TUI main menu
  import("./tui.js").then((m) => m.run());
}
