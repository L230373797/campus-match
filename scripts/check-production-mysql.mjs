#!/usr/bin/env node
import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createDataStore } from "../netlify/functions/_shared/mysql-store.mjs";
import { loadDotEnv } from "./lib/export-data.mjs";

const args = parseArgs(process.argv.slice(2));
const envFile = path.resolve(args.env || ".env.production-mysql");

loadDotEnv(path.resolve(".env.local"));
loadDotEnvOverride(envFile);

const required = ["MYSQL_HOST", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing required MySQL env vars: ${missing.join(", ")}`);
  console.error(`Create ${path.relative(process.cwd(), envFile)} or pass --env <file>.`);
  process.exit(1);
}

const placeholders = required.filter((name) => isPlaceholder(process.env[name]));
if (placeholders.length) {
  console.error(`Replace template values before checking MySQL: ${placeholders.join(", ")}`);
  console.error(`Edit ${path.relative(process.cwd(), envFile)} with your real cloud database settings.`);
  process.exit(1);
}

const env = (name) => process.env[name] || "";
const config = mysqlConfigFromEnv(env);
let connection;

try {
  connection = await mysql.createConnection(config);
  const [[version]] = await connection.query("SELECT VERSION() AS version, DATABASE() AS databaseName");
  console.log(`MySQL connection OK: ${config.host}:${config.port}/${version.databaseName}`);
  console.log(`MySQL version: ${version.version}`);

  await createDataStore({ blobStore: createNullBlobStore(), env });
  await connection.end();
  connection = await mysql.createConnection(config);

  const requiredTables = [
    "users",
    "email_verification_codes",
    "sessions",
    "matches",
    "messages",
    "看板_用户列表",
    "看板_匹配记录",
    "看板_聊天记录",
    "看板_待认证用户",
    "看板_会员概览",
  ];
  const tableCounts = {};
  for (const table of requiredTables) {
    const [[row]] = await connection.query(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}`);
    tableCounts[table] = row.count;
  }

  if (args.writeTest) {
    const writeResult = await runWriteTest(env, connection);
    console.log(`Write test OK: ${writeResult.email}`);
  }

  console.log("Required tables OK:");
  for (const [table, count] of Object.entries(tableCounts)) {
    console.log(`- ${table}: ${count}`);
  }

  console.log("");
  console.log("Production MySQL is ready for Netlify env switching.");
} catch (error) {
  console.error("Production MySQL check failed.");
  console.error(error?.message || error);
  process.exitCode = 1;
} finally {
  await connection?.end().catch(() => {});
}

process.exit(process.exitCode || 0);

async function runWriteTest(env, connection) {
  const store = await createDataStore({ blobStore: createNullBlobStore(), env });
  const id = `prod_mysql_check_${Date.now()}`;
  const email = `${id}@qq.com`;
  const now = new Date().toISOString();

  try {
    await store.setJSON(`users/${id}`, {
      id,
      email,
      nickname: "Production MySQL Check",
      school: "测试大学",
      grade: "大一",
      major: "连通性测试",
      college: "系统测试学院",
      mbti: "INTJ",
      birthDate: "2001-02-03",
      membership: { planId: "free", status: "active" },
      stats: { matches: 0, likes: 0, views: 0 },
      tags: ["生产体检"],
      sceneTags: [],
      matchModes: [],
      skippedIds: [],
      isAdmin: false,
      passwordHash: "write-test",
      passwordSalt: "write-test",
      createdAt: now,
      updatedAt: now,
    });

    const loaded = await store.get(`users/${id}`, { type: "json" });
    if (loaded?.email !== email || loaded?.mbti !== "INTJ") {
      throw new Error("Write test user could not be read back correctly.");
    }

    return { email };
  } finally {
    await connection.execute("DELETE FROM users WHERE id = ?", [id]).catch(() => {});
    for (const table of ["看板_用户列表", "看板_会员概览"]) {
      await connection.query(`DELETE FROM ${quoteIdentifier(table)} WHERE \`用户ID\` = ?`, [id]).catch(() => {});
    }
  }
}

function mysqlConfigFromEnv(env) {
  return {
    host: env("MYSQL_HOST"),
    port: Number(env("MYSQL_PORT") || 3306),
    user: env("MYSQL_USER"),
    password: env("MYSQL_PASSWORD"),
    database: env("MYSQL_DATABASE"),
    charset: "utf8mb4",
    ssl: mysqlSslConfigFromEnv(env),
  };
}

function mysqlSslConfigFromEnv(env) {
  const enabled = String(env("MYSQL_SSL") || "").trim().toLowerCase();
  if (!["1", "true", "required", "require"].includes(enabled)) {
    return undefined;
  }

  return {
    rejectUnauthorized: String(env("MYSQL_SSL_REJECT_UNAUTHORIZED") || "true").toLowerCase() !== "false",
    ...(env("MYSQL_SSL_CA") ? { ca: env("MYSQL_SSL_CA") } : {}),
  };
}

function createNullBlobStore() {
  return {
    get: async () => null,
    setJSON: async () => {},
    set: async () => {},
    delete: async () => {},
    list: async () => ({ blobs: [], cursor: null }),
  };
}

function quoteIdentifier(value) {
  return `\`${String(value).replace(/`/g, "``")}\``;
}

function parseArgs(rawArgs) {
  const parsed = { writeTest: false, env: "" };
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === "--write-test") {
      parsed.writeTest = true;
      continue;
    }

    if (arg === "--env") {
      parsed.env = rawArgs[index + 1] || "";
      index += 1;
      continue;
    }

    if (arg.startsWith("--env=")) {
      parsed.env = arg.slice("--env=".length);
    }
  }

  return parsed;
}

function isPlaceholder(value) {
  const text = String(value || "").toLowerCase();
  return text.includes("replace-with") || text.includes("your-rds-host") || text.includes("example.com");
}

function loadDotEnvOverride(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      continue;
    }

    process.env[match[1]] = stripQuotes(match[2].trim());
  }
}

function stripQuotes(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}
