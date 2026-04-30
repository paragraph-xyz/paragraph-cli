import type { SendCustomEmail200 } from "@paragraph-com/sdk";
import { createClient } from "./client.js";

export async function sendCustomEmail(params: {
  apiKey: string;
  subject: string;
  body: string;
  emails: string[];
  dryRun?: boolean;
}): Promise<SendCustomEmail200> {
  const client = createClient(params.apiKey);
  return client.emails.send({
    subject: params.subject,
    body: params.body,
    emails: params.emails,
    ...(params.dryRun ? { dryRun: true } : {}),
  });
}
