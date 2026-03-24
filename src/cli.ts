import { createProgram } from "./cli/program.js";
import { handleError } from "./cli/lib/error.js";

export async function run() {
  const program = createProgram();
  await program.parseAsync(process.argv).catch(handleError);
}
