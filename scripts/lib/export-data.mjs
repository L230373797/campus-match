import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { execFileSync } from "node:child_process";

export const DEFAULT_API_BASE = "https://campus-match-sansui.netlify.app";
export const STORE_NAME = "campus-match-data";

export function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) {
      continue;
    }

    process.env[match[1]] = stripQuotes(match[2].trim());
  }
}

export function normalizeBaseUrl(value) {
  return String(value || DEFAULT_API_BASE).replace(/\/+$/, "");
}

export async function loadExportData({
  source = "auto",
  apiBase = DEFAULT_API_BASE,
  sanitizeUsers = true,
} = {}) {
  if (source === "api" || (source === "auto" && hasApiCredentials())) {
    return loadExportDataFromApi(apiBase, { sanitizeUsers });
  }

  if (source === "blobs" || source === "auto") {
    return loadExportDataFromBlobs({ sanitizeUsers });
  }

  throw new Error(`Unknown sync source: ${source}`);
}

export function runNetlify(args) {
  if (process.platform === "win32") {
    return execFileSync("cmd.exe", ["/d", "/s", "/c", ["npx", "netlify", ...args].map(quoteWindowsArg).join(" ")], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  }

  return execFileSync("npx", ["netlify", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export function runNetlifyJson(args) {
  return JSON.parse(runNetlify(args));
}

function stripQuotes(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

function hasApiCredentials() {
  return Boolean(process.env.CAMPUS_ADMIN_TOKEN || (process.env.CAMPUS_ADMIN_EMAIL && process.env.CAMPUS_ADMIN_PASSWORD));
}

async function loadExportDataFromApi(apiBase, { sanitizeUsers }) {
  const token = await getAdminToken(apiBase);
  const exportData = await requestJson(`${apiBase}/api/admin/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!exportData?.success || !exportData?.data) {
    throw new Error(exportData?.message || "Export endpoint returned an unexpected response.");
  }

  return normalizeExportData(exportData.data, { sanitizeUsers });
}

function loadExportDataFromBlobs({ sanitizeUsers }) {
  const listing = runNetlifyJson(["blobs:list", STORE_NAME, "--json"]);
  const keys = (listing.blobs || []).map((blob) => blob.key);
  const adminEmails = loadAdminEmailsFromNetlify();
  const users = keys
    .filter((key) => key.startsWith("users/"))
    .map(readBlobJson)
    .map((user) => markAdmin(sanitizeUsers ? sanitizeUser(user) : user, adminEmails));
  const matches = keys.filter((key) => key.startsWith("matches/")).map(readBlobJson);
  const messages = keys
    .filter((key) => key.startsWith("messages/"))
    .flatMap((key) => {
      const matchId = key.replace(/^messages\//, "");
      const thread = readBlobJson(key);
      return (Array.isArray(thread) ? thread : []).map((message) => ({
        ...message,
        matchId: message.matchId || message.match || matchId,
      }));
    });

  return normalizeExportData({
    exportedAt: new Date().toISOString(),
    counts: {
      users: users.length,
      matches: matches.length,
      messages: messages.length,
    },
    users,
    matches,
    messages,
  }, { sanitizeUsers: false });
}

function normalizeExportData(data, { sanitizeUsers }) {
  const users = (data.users || []).map((user) => sanitizeUsers ? sanitizeUser(user) : user);
  const matches = data.matches || [];
  const messages = data.messages || [];
  return {
    exportedAt: data.exportedAt || new Date().toISOString(),
    counts: {
      users: users.length,
      matches: matches.length,
      messages: messages.length,
    },
    users,
    matches,
    messages,
  };
}

function sanitizeUser(user) {
  const { passwordHash, passwordSalt, skippedIds, ...safeUser } = user || {};
  return safeUser;
}

function markAdmin(user, adminEmails) {
  return {
    ...user,
    isAdmin: adminEmails.has(String(user.email || "").trim().toLowerCase()),
  };
}

function loadAdminEmailsFromNetlify() {
  try {
    return new Set(
      runNetlify(["env:get", "CAMPUS_ADMIN_EMAILS", "--context", "production"])
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    );
  } catch {
    return new Set();
  }
}

function readBlobJson(key) {
  return JSON.parse(runNetlify(["blobs:get", STORE_NAME, key]));
}

async function getAdminToken(apiBase) {
  if (process.env.CAMPUS_ADMIN_TOKEN) {
    return process.env.CAMPUS_ADMIN_TOKEN;
  }

  const email = process.env.CAMPUS_ADMIN_EMAIL || await promptVisible("Admin email: ");
  const password = process.env.CAMPUS_ADMIN_PASSWORD || await promptHidden("Admin password: ");
  const login = await requestJson(`${apiBase}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!login?.success || !login?.data?.token) {
    throw new Error(login?.message || "Admin login failed.");
  }

  return login.data.token;
}

async function promptVisible(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await rl.question(question);
  } finally {
    rl.close();
  }
}

async function promptHidden(question) {
  if (!process.stdin.isTTY) {
    return promptVisible(question);
  }

  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    let value = "";

    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
    };

    const finish = () => {
      cleanup();
      stdout.write("\n");
      resolve(value);
    };

    const onData = (buffer) => {
      const char = buffer.toString("utf8");
      if (char === "\u0003") {
        cleanup();
        reject(new Error("Cancelled."));
        return;
      }

      if (char === "\r" || char === "\n") {
        finish();
        return;
      }

      if (char === "\b" || char === "\u007f") {
        value = value.slice(0, -1);
        return;
      }

      value += char;
    };

    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.message || `Request failed with HTTP ${response.status}: ${url}`);
  }

  return body;
}

function quoteWindowsArg(value) {
  const text = String(value);
  if (!/[ \t"&|<>^]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '\\"')}"`;
}
