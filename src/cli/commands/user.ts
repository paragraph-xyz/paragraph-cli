import { Command } from "commander";
import { getUser } from "../../services/users.js";
import { outputData } from "../lib/output.js";
import { handleError } from "../lib/error.js";

export function registerUserCommands(program: Command): void {
  const user = program.command("user").description("Look up users");

  user
    .command("get <id-or-wallet>")
    .description("Get user details by ID or wallet address")
    .action(async function (this: Command, idOrWallet: string) {
      try {
        const data = await getUser(idOrWallet);
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
