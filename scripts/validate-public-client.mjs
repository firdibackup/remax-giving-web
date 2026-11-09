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
let failureMode = null;

try {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public-client-test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), headers: new Headers(options.headers) });
    if (failureMode === "network") {
      throw new TypeError("fetch failed", { cause: Object.assign(new Error("connect timed out"), { code: "UND_ERR_CONNECT_TIMEOUT" }) });
    }
    if (failureMode === "hang") {
      return new Promise((resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
      });
    }
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
  failureMode = "network";
  const networkFailure = await client.from("hog_campaigns").select("id");
  assert.equal(networkFailure.status, 0);
  assert.match(networkFailure.error.details, /UND_ERR_CONNECT_TIMEOUT/);
  assert.equal(requests.length, 3, "Connection failures must not trigger automatic retries");

  failureMode = "hang";
  const started = Date.now();
  const timeoutFailure = await client.from("hog_campaigns").select("id");
  assert.equal(timeoutFailure.status, 0);
  assert.ok(timeoutFailure.error);
  assert.ok(Date.now() - started < 12000, "Stalled requests must stop after the configured timeout");
  assert.equal(requests.length, 4, "Timed-out requests must not be retried");
  console.log("Public client checks passed: anonymous queries, no Auth requests, explicit failures, no automatic retries, bounded timeout.");
} finally {
  globalThis.fetch = originalFetch;
  process.env = originalEnv;
}
