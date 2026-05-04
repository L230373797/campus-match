#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const baseUrl = normalizeBaseUrl(args.baseUrl || process.env.CAMPUS_MATCH_BASE_URL || "https://campus-match-sansui.netlify.app");
const reportPath = path.resolve("output/production-acceptance-report.json");
const results = [];

await fs.mkdir(path.dirname(reportPath), { recursive: true });

const pageChecks = [
  { path: "/", expect: ["<div id=\"root\"", "/assets/"] },
  { path: "/login", expect: ["<div id=\"root\"", "/assets/"] },
  { path: "/profile", expect: ["<div id=\"root\"", "/assets/"] },
  { path: "/search.html", expect: ["校园匹配"] },
  { path: "/upload.html", expect: ["校园匹配"] },
  { path: "/admin.html", expect: ["admin.js"] },
  { path: "/privacy", expect: ["隐私"] },
  { path: "/terms", expect: ["协议"] },
];

for (const item of pageChecks) {
  await check(`GET ${item.path}`, async () => {
    const response = await fetchUrl(item.path);
    assert(response.status === 200, `expected 200, got ${response.status}`);
    const text = await response.text();
    for (const expected of item.expect) {
      assert(text.includes(expected), `missing "${expected}"`);
    }
  });
}

await check("entry assets load", async () => {
  const response = await fetchUrl("/");
  const html = await response.text();
  const assetPaths = Array.from(html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)).map((match) => match[1]);
  assert(assetPaths.length >= 2, "expected JS/CSS assets in entry HTML");

  for (const assetPath of assetPaths) {
    const asset = await fetchAbsolute(assetPath);
    assert(asset.status === 200, `${assetPath} returned ${asset.status}`);
    const contentType = asset.headers.get("content-type") || "";
    assert(
      contentType.includes("javascript") || contentType.includes("css") || contentType.includes("text/plain"),
      `${assetPath} has unexpected content-type ${contentType}`,
    );
  }
});

await check("admin script loads", async () => {
  const response = await fetchUrl("/admin.js");
  assert(response.status === 200, `expected 200, got ${response.status}`);
  const text = await response.text();
  assert(text.includes("requestApi") && text.includes("/admin/overview"), "admin script should include API usage");
});

await check("health endpoint", async () => {
  const response = await fetchUrl("/api/health");
  assert(response.status === 200, `expected 200, got ${response.status}`);
  const payload = await response.json();
  assert(payload.data?.status === "ok" || payload.status === "ok", "health status should be ok");
});

await check("profile endpoint requires login", async () => {
  const response = await fetchUrl("/api/users/profile");
  assert(response.status === 401, `expected 401, got ${response.status}`);
});

await check("admin overview requires login", async () => {
  const response = await fetchUrl("/api/admin/overview");
  assert(response.status === 401, `expected 401, got ${response.status}`);
});

const failed = results.filter((result) => !result.ok);
await fs.writeFile(
  reportPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      baseUrl,
      ok: failed.length === 0,
      results,
    },
    null,
    2,
  ),
);

for (const result of results) {
  const prefix = result.ok ? "PASS" : "FAIL";
  console.log(`${prefix} ${result.name}${result.detail ? ` - ${result.detail}` : ""}`);
}

console.log(`Report: ${reportPath}`);

if (failed.length) {
  process.exitCode = 1;
}

async function fetchUrl(pathname, init) {
  return fetchAbsolute(new URL(pathname, `${baseUrl}/`).toString(), init);
}

async function fetchAbsolute(urlOrPath, init) {
  const url = urlOrPath.startsWith("http") ? urlOrPath : new URL(urlOrPath, `${baseUrl}/`).toString();
  return fetch(url, {
    redirect: "follow",
    ...init,
    headers: {
      "user-agent": "campus-match-production-acceptance/1.0",
      ...(init?.headers || {}),
    },
  });
}

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, detail: error.message || String(error) });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/+$/, "");
}

function parseArgs(rawArgs) {
  const parsed = { baseUrl: "" };
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === "--base-url") {
      parsed.baseUrl = rawArgs[index + 1] || "";
      index += 1;
      continue;
    }
    if (arg.startsWith("--base-url=")) {
      parsed.baseUrl = arg.slice("--base-url=".length);
    }
  }
  return parsed;
}
