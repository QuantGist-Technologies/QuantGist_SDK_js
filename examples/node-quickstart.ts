/**
 * QuantGist JS SDK — Node 20 Quickstart
 *
 * Run with:  npx tsx examples/node-quickstart.ts
 *
 * Set your API key first:
 *   export QUANTGIST_API_KEY=qg_live_...
 */

import { QuantGistClient } from "../src/index.js";

const apiKey = process.env["QUANTGIST_API_KEY"];
if (!apiKey) {
  console.error(
    "Error: QUANTGIST_API_KEY environment variable is not set.\n" +
      "Get your free API key at https://quantgist.com/dashboard",
  );
  process.exit(1);
}

const client = new QuantGistClient({ apiKey });

const { data, meta } = await client.getEvents({ impact: "high" });

console.log(`Fetched ${data.length} of ${meta.total} high-impact events\n`);

for (const event of data) {
  const actual =
    event.actual !== null ? `actual=${event.actual}` : "pending";
  console.log(
    `${event.release_time} | ${event.country} | ${event.currency} | ${event.title} | ${actual}`,
  );
}
