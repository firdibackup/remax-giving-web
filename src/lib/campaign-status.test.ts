// Run: node --test --experimental-strip-types src/lib/campaign-status.test.ts (Node >= 22.6)
import { test } from "node:test";
import assert from "node:assert/strict";
import { isCampaignExpired } from "./campaign-status.ts";

test("isCampaignExpired", () => {
  assert.equal(isCampaignExpired(null), false);
  assert.equal(isCampaignExpired("2000-01-01", "2020-01-01"), true);
  assert.equal(isCampaignExpired("2020-01-02", "2020-01-01"), false);
  // last day is still open
  assert.equal(isCampaignExpired("2020-01-01", "2020-01-01"), false);
});
