import { Command } from "commander";
import { getUser } from "../../services/users.js";
import { outputData } from "../lib/output.js";
import { handleError } from "../lib/error.js";

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
        const id = positionalId || opts.id;
        if (!id) throw new Error("Missing user ID or wallet. Pass it as an argument or with --id.");
        const data = await getUser(id);
        outputData(
          this,
          {
            ID: data.id as string,
            Name: data.name as string,
            Wallet: data.walletAddress as string,
            Publication: data.publicationId as string,
            Bio: data.bio as string,
          },
          data
        );
      } catch (err) {
        handleError(err);
      }
    });
}
