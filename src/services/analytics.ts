import { analyticsQueryBody } from "@paragraph-com/sdk/zod";
import type { AnalyticsQuery200, AnalyticsSchema200 } from "@paragraph-com/sdk";
import { createClient } from "./client.js";

export async function runQuery(
  sql: string,
  apiKey: string
): Promise<AnalyticsQuery200> {
  analyticsQueryBody.parse({ sql });
  const client = createClient(apiKey);
  return client.analytics.query({ sql });
}

export async function getSchema(apiKey: string): Promise<AnalyticsSchema200> {
  const client = createClient(apiKey);
  return client.analytics.schema();
}
