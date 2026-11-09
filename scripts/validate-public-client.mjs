import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../src/lib/supabase/public.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
const requests = [];
let connections = 0;
let status = 200;

try {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public-client-test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), headers: new Headers(options.headers) });
    return new Response(
      JSON.stringify(status === 200 ? [{ id: "published-campaign" }] : { message: "Unavailable" }),
      { status, headers: { "Content-Type": "application/json" } },
    );
  };
  const loaded = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    (id) => {
      if (id === "server-only") return {};
      if (id === "next/server") return { connection: async () => { connections++; } };
      return require(id);
    },
    loaded,
    loaded.exports,
  );

  const client = await loaded.exports.createClient();
  const result = await client.from("hog_campaigns").select("id");
  assert.equal(connections, 1, "Public data must remain request-time");
  assert.equal(result.error, null);
  assert.deepEqual(result.data, [{ id: "published-campaign" }]);
  assert.equal((await client.auth.getSession()).data.session, null);

  status = 403;
  const failed = await client.from("hog_campaigns").select("id");
  assert.equal(failed.status, 403);
  assert.ok(failed.error, "Query errors must not be disguised as empty donation data");
  assert.equal(failed.data, null);
  assert.equal(requests.length, 2, "Public queries must not make Auth requests");
  for (const request of requests) {
    assert.equal(new URL(request.url).pathname, "/rest/v1/hog_campaigns");
    assert.equal(request.headers.get("apikey"), "sb_publishable_test");
    assert.equal(request.headers.get("cookie"), null);
    assert.equal(request.headers.get("authorization"), "Bearer sb_publishable_test");
  }
  console.log("Public client checks passed: anonymous queries, no Auth requests, request-time data, explicit failures.");
} finally {
  globalThis.fetch = originalFetch;
  process.env = originalEnv;
}
