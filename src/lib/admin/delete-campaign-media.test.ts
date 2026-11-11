// Run: node --experimental-strip-types --test src/lib/admin/delete-campaign-media.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/database.types.ts";
import { deleteCampaignMediaAsset } from "./delete-campaign-media.ts";

const stem = "1793956263808-7af5b9fc-b2d9-4011-ae66-642fc62e5d29";
function fixture(options: { scope?: boolean; storageError?: boolean; databaseError?: boolean; listError?: boolean; external?: boolean } = {}) {
  const events: string[] = [];
  const filters: unknown[][] = [];
  let removed: string[] = [];
  const client = {
    from(table: string) {
      let deleting = false;
      const query = {
        eq(...args: unknown[]) { filters.push([table, ...args]); return query; },
        delete() { deleting = true; return query; },
        select() {
          if (!deleting) return query;
          events.push("delete-record");
          return query;
        },
        maybeSingle: async () => ({ data: options.scope === false ? null : { id: "asset" }, error: null }),
        single: async () => ({ data: { id: "asset", storage_bucket: options.external ? null : "home-of-giving-public-media", storage_path: options.external ? null : `campaigns/test/${stem}.webp`, external_url: options.external ? "https://example.com/image.jpg" : null }, error: null }),
        then(resolve: (value: unknown) => unknown) {
          return Promise.resolve({ data: options.databaseError ? null : [{ id: "asset" }], error: options.databaseError ? {} : null }).then(resolve);
        },
      };
      return query;
    },
    storage: { from: () => ({
      list: async () => ({ data: [{ id: "original", name: `${stem}.jpg` }, { id: "other", name: `${stem}-other.jpg` }], error: options.listError ? {} : null }),
      remove: async (paths: string[]) => { events.push("remove-files"); removed = paths; return { error: options.storageError ? {} : null }; },
    }) },
  } as unknown as SupabaseClient<Database>;
  return { client, events, filters, removed: () => removed };
}

test("deletes exact display/original files before asset; scopes documentation to its program", async () => {
  const f = fixture();
  assert.deepEqual(await deleteCampaignMediaAsset(f.client, "campaign", "asset", "documentation"), {});
  assert.deepEqual(f.events, ["remove-files", "delete-record"]);
  assert.deepEqual(f.removed(), [`campaigns/test/${stem}.webp`, `campaigns/test/originals/${stem}.jpg`]);
  assert.ok(f.filters.some((filter) => filter[1] === "campaign_id" && filter[2] === "campaign"));
  assert.ok(f.filters.some((filter) => filter[1] === "role" && filter[2] === "documentation"));
});

test("cover must still belong to the requested program", async () => {
  const f = fixture({ scope: false });
  assert.ok((await deleteCampaignMediaAsset(f.client, "campaign", "asset", "cover")).error);
  assert.deepEqual(f.events, []);
  assert.ok(f.filters.some((filter) => filter[1] === "cover_media_id" && filter[2] === "asset"));
});

test("storage and original-discovery failures retain the record for retry", async () => {
  for (const options of [{ storageError: true }, { listError: true }]) {
    const f = fixture(options);
    assert.ok((await deleteCampaignMediaAsset(f.client, "campaign", "asset", "cover")).error);
    assert.ok(!f.events.includes("delete-record"));
  }
});

test("reports partial failure when database deletion fails after Storage cleanup", async () => {
  const f = fixture({ databaseError: true });
  assert.match((await deleteCampaignMediaAsset(f.client, "campaign", "asset", "cover")).error || "", /record aset belum terhapus/);
  assert.deepEqual(f.events, ["remove-files", "delete-record"]);
});

test("external URLs cannot claim permanent deletion of a third-party file", async () => {
  const f = fixture({ external: true });
  assert.ok((await deleteCampaignMediaAsset(f.client, "campaign", "asset", "cover")).error);
  assert.deepEqual(f.events, []);
});
