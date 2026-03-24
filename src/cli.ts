import { CommanderError } from "commander";
import { createProgram } from "./cli/program.js";
import { handleError } from "./cli/lib/error.js";

export async function run() {
  const program = createProgram();
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err instanceof CommanderError) {
      // --help and --version exit with code 0
      if (err.exitCode === 0) process.exit(0);
      process.exit(err.exitCode);
    }
    handleError(err);
  }
}
