import { Command } from "commander";
import { getUser } from "../../services/users.js";
import { outputData } from "../lib/output.js";
import { handleError } from "../lib/error.js";
import { requireArg } from "../lib/args.js";

export function registerUserCommands(program: Command): void {
  const user = program.command("user").description("Look up users");

  user
    .command("get [id-or-wallet]")
    .description("Get user details by ID or wallet address")
    .option("--id <id-or-wallet>", "User ID or wallet address")
    .addHelpText("after", `
Examples:
  $ paragraph user get abc123
  $ paragraph user get --id 0x1234...abcd
  $ paragraph user get abc123 --json`)
    .action(async function (this: Command, positionalId: string | undefined, opts) {
      try {
        const id = requireArg(positionalId, opts.id, "user ID or wallet");
        const data = await getUser(id);
        outputData(
          this,
          {
            ID: data.id,
            Name: data.name,
            Wallet: data.walletAddress,
            Publication: data.publicationId,
            Bio: data.bio,
          },
          data
        );
      } catch (err) {
        handleError(err);
      }
    });
}
