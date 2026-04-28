#!/usr/bin/env node
import { createServer } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import apiHandler from "../netlify/functions/api.mjs";
import { createLocalBlobStore } from "./local-blob-store.mjs";
import { loadDotEnv } from "../scripts/lib/export-data.mjs";

loadDotEnv(path.resolve(".env.local"));

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);
const publicDir = path.resolve("public");
const blobRoot = path.resolve("local-data", "blob-store");
const blobStore = createLocalBlobStore(blobRoot);

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || `${host}:${port}`}`);

    if (url.pathname.startsWith("/api/")) {
      const request = await toWebRequest(req, url);
      const response = await apiHandler(request, { blobStore });
      await writeWebResponse(res, response);
      return;
    }

    await serveStatic(res, url.pathname);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Internal Server Error");
  }
});

server.listen(port, host, () => {
  console.log(`Standalone campus-match server ready at http://${host}:${port}`);
});

async function toWebRequest(req, url) {
  const body = await readBody(req);
  return new Request(url, {
    method: req.method,
    headers: req.headers,
    body: body.length ? body : undefined,
  });
}

async function writeWebResponse(res, response) {
  res.statusCode = response.status;
  for (const [key, value] of response.headers.entries()) {
    res.setHeader(key, value);
  }

  if (!response.body || response.status === 204 || response.status === 304) {
    res.end();
    return;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}

async function serveStatic(res, pathname) {
  const resolved = await resolveStaticPath(pathname);
  const filePath = resolved || path.join(publicDir, "index.html");
  const content = await fs.readFile(filePath);
  res.statusCode = 200;
  res.setHeader("Content-Type", contentTypeFor(filePath));
  res.end(content);
}

async function resolveStaticPath(pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const candidate = path.resolve(publicDir, `.${safePath}`);
  const normalizedPublic = path.resolve(publicDir);
  if (!candidate.startsWith(normalizedPublic)) {
    return null;
  }

  try {
    const stat = await fs.stat(candidate);
    if (stat.isFile()) {
      return candidate;
    }
  } catch {
    return null;
  }

  return null;
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ico": "image/x-icon",
    ".txt": "text/plain; charset=utf-8",
  }[ext] || "application/octet-stream";
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
