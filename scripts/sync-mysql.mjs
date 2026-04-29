#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import mysql from "mysql2/promise";
import { DEFAULT_API_BASE, loadDotEnv, loadExportData, normalizeBaseUrl } from "./lib/export-data.mjs";

const DEFAULT_DATABASE = "campus_match";
const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

loadDotEnv(path.resolve(".env.local"));

try {
  const apiBase = normalizeBaseUrl(args.api || process.env.CAMPUS_API_BASE || DEFAULT_API_BASE);
  const source = args.source || process.env.CAMPUS_SYNC_SOURCE || "blobs";
  const database = args.database || process.env.MYSQL_DATABASE || DEFAULT_DATABASE;
  const config = getMysqlConfig(database);
  const exportData = args.schemaOnly
    ? emptyExportData()
    : await loadExportData({ source, apiBase, sanitizeUsers: false });

  await syncMysql(config, database, exportData);
  console.log(`MySQL synced to ${config.host}:${config.port}/${database}`);
  console.log(`Imported ${exportData.counts.users} users, ${exportData.counts.matches} matches, ${exportData.counts.messages} messages.`);
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help" || item === "-h") {
      parsed.help = true;
    } else if (item === "--api") {
      parsed.api = argv[++index];
    } else if (item === "--source") {
      parsed.source = argv[++index];
    } else if (item === "--database") {
      parsed.database = argv[++index];
    } else if (item === "--schema-only") {
      parsed.schemaOnly = true;
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`Usage: npm run sync:mysql -- [options]

Options:
  --api <url>         API base URL. Defaults to ${DEFAULT_API_BASE}
  --source <mode>     blobs or api. Defaults to blobs
  --database <name>   MySQL database name. Defaults to ${DEFAULT_DATABASE}
  --schema-only       Create/update schema without importing data
  -h, --help          Show this help text

Environment:
  MYSQL_HOST
  MYSQL_PORT
  MYSQL_DATABASE
  MYSQL_USER
  MYSQL_PASSWORD
  CAMPUS_API_BASE
  CAMPUS_SYNC_SOURCE
  CAMPUS_ADMIN_EMAIL
  CAMPUS_ADMIN_PASSWORD
  CAMPUS_ADMIN_TOKEN
`);
}

function getMysqlConfig(database) {
  const host = process.env.MYSQL_HOST || "127.0.0.1";
  const port = Number(process.env.MYSQL_PORT || 3306);
  const user = process.env.MYSQL_USER || "root";
  const password = process.env.MYSQL_PASSWORD;

  if (!password) {
    throw new Error("MYSQL_PASSWORD is missing. Put your MySQL credentials in .env.local first.");
  }

  return {
    host,
    port,
    user,
    password,
    database,
  };
}

async function syncMysql(config, database, exportData) {
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true,
    charset: "utf8mb4",
  });

  try {
    await ensureSchema(connection, database);
    await ensureUserSchemaCompatibility(connection, database);
    await connection.changeUser({ database });
    await connection.beginTransaction();

    await clearTables(connection);
    await insertMeta(connection, exportData);

    for (const user of exportData.users || []) {
      await insertUser(connection, user);
    }

    for (const match of exportData.matches || []) {
      await insertMatch(connection, match);
    }

    for (const [index, message] of (exportData.messages || []).entries()) {
      await insertMessage(connection, message, index);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

async function ensureSchema(connection, database) {
  const schemaPath = path.resolve("db", "mysql", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  const normalized = sql
    .replace(/CREATE DATABASE IF NOT EXISTS campus_match/gi, `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(database)}`)
    .replace(/USE campus_match;/gi, `USE ${quoteIdentifier(database)};`);
  await connection.query(normalized);
}

async function ensureUserSchemaCompatibility(connection, database) {
  await ensureColumn(connection, database, "users", "mbti", "VARCHAR(4) NULL AFTER dorm_area");
  await ensureColumn(connection, database, "users", "birth_date", "DATE NULL AFTER mbti");
  await ensureIndex(connection, database, "users", "users_mbti_idx", "CREATE INDEX users_mbti_idx ON users (mbti)");
  await ensureIndex(connection, database, "users", "users_birth_date_idx", "CREATE INDEX users_birth_date_idx ON users (birth_date)");
}

async function ensureColumn(connection, database, table, column, definition) {
  const [rows] = await connection.execute(`
    SELECT COUNT(*) AS count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
  `, [database, table, column]);

  if (Number(rows?.[0]?.count || 0) > 0) {
    return;
  }

  await connection.query(`ALTER TABLE ${quoteIdentifier(database)}.${quoteIdentifier(table)} ADD COLUMN ${quoteIdentifier(column)} ${definition}`);
}

async function ensureIndex(connection, database, table, indexName, createSql) {
  const [rows] = await connection.execute(`
    SELECT COUNT(*) AS count
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?
  `, [database, table, indexName]);

  if (Number(rows?.[0]?.count || 0) > 0) {
    return;
  }

  await connection.query(createSql);
}

async function clearTables(connection) {
  await connection.query(`
    DELETE FROM messages;
    DELETE FROM matches;
    DELETE FROM sessions;
    DELETE FROM email_verification_codes;
    DELETE FROM users;
    DELETE FROM app_meta;
  `);
}

async function insertMeta(connection, exportData) {
  const metaRows = [
    ["exported_at", JSON.stringify(exportData.exportedAt || new Date().toISOString())],
    ["counts", JSON.stringify(exportData.counts || {})],
  ];

  for (const [key, value] of metaRows) {
    await connection.execute(
      "INSERT INTO app_meta (meta_key, meta_value) VALUES (?, CAST(? AS JSON))",
      [key, value]
    );
  }
}

async function insertUser(connection, user) {
  await connection.execute(`
    INSERT INTO users (
      id, email, student_id, nickname, school, grade, major, college, campus_zone, dorm_area,
      mbti, birth_date, bio, schedule_text, ideal_scene, relationship_goal, allow_anonymous_match, allow_offline_events,
      campus_card_image, avatar, is_verified, verification_status, verification_badge,
      verification_requested_at, verification_reviewed_at, verification_notes, membership_json, stats_json,
      tags_json, scene_tags_json, match_modes_json, skipped_ids_json, is_admin, password_hash,
      password_salt, created_at, updated_at, raw_json
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON),
      CAST(? AS JSON), CAST(? AS JSON), CAST(? AS JSON), CAST(? AS JSON), ?, ?,
      ?, ?, ?, CAST(? AS JSON)
    )
  `, [
    user.id,
    user.email || null,
    user.studentId || null,
    user.nickname || "",
    user.school || null,
    user.grade || null,
    user.major || null,
    user.college || null,
    user.campusZone || null,
    user.dormArea || null,
    normalizeMysqlMbti(user.mbti),
    normalizeMysqlDate(user.birthDate || user.birthday),
    user.bio || null,
    user.schedule || null,
    user.idealScene || null,
    user.relationshipGoal || null,
    booleanAsInt(user.allowAnonymousMatch, true),
    booleanAsInt(user.allowOfflineEvents, true),
    user.campusCardImage || null,
    user.avatar || null,
    booleanAsInt(user.isVerified, false),
    user.verificationStatus || "unverified",
    user.verificationBadge || null,
    toMysqlDateTime(user.verificationRequestedAt),
    toMysqlDateTime(user.verificationReviewedAt),
    user.verificationNotes || null,
    jsonString(user.membership || null),
    jsonString(user.stats || null),
    jsonString(user.tags || []),
    jsonString(user.sceneTags || []),
    jsonString(user.matchModes || []),
    jsonString(user.skippedIds || []),
    booleanAsInt(user.isAdmin, false),
    user.passwordHash || null,
    user.passwordSalt || null,
    toMysqlDateTime(user.createdAt),
    toMysqlDateTime(user.updatedAt),
    jsonString(user),
  ]);
}

async function insertMatch(connection, match) {
  const participants = Array.isArray(match.participants) ? match.participants : [];
  const pairKey = [...participants].sort().join("__");

  await connection.execute(`
    INSERT INTO matches (
      id, pair_key, participant_a, participant_b, participant_ids_json, user_snapshots_json,
      reveal_requests_json, identity_revealed, matched_at, last_message_at, created_at, updated_at, raw_json
    ) VALUES (
      ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON),
      CAST(? AS JSON), ?, ?, ?, ?, ?, CAST(? AS JSON)
    )
  `, [
    match.id,
    pairKey || match.id,
    participants[0] || null,
    participants[1] || null,
    jsonString(participants),
    jsonString(match.userSnapshots || null),
    jsonString(match.revealRequests || []),
    booleanAsInt(match.identityRevealed, false),
    toMysqlDateTime(match.matchedAt),
    toMysqlDateTime(match.lastMessageAt),
    toMysqlDateTime(match.createdAt),
    toMysqlDateTime(match.updatedAt),
    jsonString(match),
  ]);
}

async function insertMessage(connection, message, index) {
  const sender = message.sender || {};
  await connection.execute(`
    INSERT INTO messages (
      id, match_id, sender_id, sender_nickname, message_type, content, created_at, raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON))
  `, [
    message.id || message._id || `${message.matchId || message.match || "unknown"}:${index}`,
    message.matchId || message.match || null,
    message.senderId || sender.id || sender._id || null,
    sender.nickname || null,
    message.type || "text",
    message.content || null,
    toMysqlDateTime(message.createdAt),
    jsonString(message),
  ]);
}

function booleanAsInt(value, fallback) {
  return (value ?? fallback) ? 1 : 0;
}

function jsonString(value) {
  return JSON.stringify(value ?? null);
}

function toMysqlDateTime(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function normalizeMysqlMbti(value) {
  const mbti = String(value || "").trim().toUpperCase();
  return /^(I|E)(N|S)(F|T)(J|P)$/.test(mbti) ? mbti : null;
}

function normalizeMysqlDate(value) {
  const raw = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return null;
  }

  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) ? raw : null;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function quoteIdentifier(value) {
  return `\`${String(value).replace(/`/g, "``")}\``;
}

function emptyExportData() {
  return {
    exportedAt: new Date().toISOString(),
    counts: { users: 0, matches: 0, messages: 0 },
    users: [],
    matches: [],
    messages: [],
  };
}
