#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";
import { DEFAULT_API_BASE, loadDotEnv, loadExportData, normalizeBaseUrl } from "./lib/export-data.mjs";

const DEFAULT_DB_PATH = path.resolve("local-data", "campus-match.sqlite");
const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

loadDotEnv(path.resolve(".env.local"));

try {
  const apiBase = normalizeBaseUrl(args.api || process.env.CAMPUS_API_BASE || DEFAULT_API_BASE);
  const dbPath = path.resolve(args.output || process.env.CAMPUS_LOCAL_DB || DEFAULT_DB_PATH);
  const source = args.source || process.env.CAMPUS_SYNC_SOURCE || "auto";
  const exportData = await loadExportData({ source, apiBase, sanitizeUsers: true });

  writeSqlite(dbPath, exportData, apiBase);
  console.log(`Synced ${exportData.counts.users} users, ${exportData.counts.matches} matches, ${exportData.counts.messages} messages.`);
  console.log(`Local database: ${dbPath}`);
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
    } else if (item === "--output" || item === "-o") {
      parsed.output = argv[++index];
    } else if (item === "--source") {
      parsed.source = argv[++index];
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`Usage: npm run sync:db -- [options]

Options:
  --api <url>       API base URL. Defaults to ${DEFAULT_API_BASE}
  -o, --output <db> SQLite output path. Defaults to ${DEFAULT_DB_PATH}
  --source <mode>   auto, blobs, or api. Defaults to auto
  -h, --help        Show this help text

Environment:
  CAMPUS_ADMIN_TOKEN       Existing bearer token
  CAMPUS_ADMIN_EMAIL       Admin login email
  CAMPUS_ADMIN_PASSWORD    Admin login password
  CAMPUS_API_BASE          API base URL
  CAMPUS_LOCAL_DB          SQLite output path
  CAMPUS_SYNC_SOURCE       auto, blobs, or api
`);
}

function writeSqlite(dbPath, data, apiBase) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);

  try {
    db.exec(`
      PRAGMA journal_mode = DELETE;
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT,
        student_id TEXT,
        nickname TEXT,
        school TEXT,
        grade TEXT,
        major TEXT,
        college TEXT,
        campus_zone TEXT,
        dorm_area TEXT,
        bio TEXT,
        avatar TEXT,
        campus_card_image TEXT,
        verification_status TEXT,
        verification_badge TEXT,
        verification_notes TEXT,
        verification_requested_at TEXT,
        verification_reviewed_at TEXT,
        is_verified INTEGER,
        is_admin INTEGER,
        membership_type TEXT,
        created_at TEXT,
        updated_at TEXT,
        raw_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS user_tags (
        user_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        participant_a TEXT,
        participant_b TEXT,
        participant_ids TEXT,
        identity_revealed INTEGER,
        matched_at TEXT,
        last_message_at TEXT,
        updated_at TEXT,
        raw_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        match_id TEXT,
        sender_id TEXT,
        sender_nickname TEXT,
        type TEXT,
        content TEXT,
        created_at TEXT,
        raw_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
      CREATE INDEX IF NOT EXISTS users_verification_idx ON users(verification_status);
      CREATE INDEX IF NOT EXISTS messages_match_idx ON messages(match_id);
    `);

    db.exec("BEGIN");
    db.exec("DELETE FROM meta; DELETE FROM user_tags; DELETE FROM messages; DELETE FROM matches; DELETE FROM users;");

    const insertMeta = db.prepare("INSERT INTO meta (key, value) VALUES (?, ?)");
    insertMeta.run("api_base", apiBase);
    insertMeta.run("exported_at", data.exportedAt || new Date().toISOString());
    insertMeta.run("counts", JSON.stringify(data.counts || {}));

    const insertUser = db.prepare(`
      INSERT INTO users (
        id, email, student_id, nickname, school, grade, major, college, campus_zone, dorm_area,
        bio, avatar, campus_card_image, verification_status, verification_badge, verification_notes,
        verification_requested_at, verification_reviewed_at, is_verified, is_admin, membership_type,
        created_at, updated_at, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertTag = db.prepare("INSERT INTO user_tags (user_id, kind, value) VALUES (?, ?, ?)");

    for (const user of data.users || []) {
      insertUser.run(
        user.id,
        user.email || null,
        user.studentId || null,
        user.nickname || null,
        user.school || null,
        user.grade || null,
        user.major || null,
        user.college || null,
        user.campusZone || null,
        user.dormArea || null,
        user.bio || null,
        user.avatar || null,
        user.campusCardImage || null,
        user.verificationStatus || null,
        user.verificationBadge || null,
        user.verificationNotes || null,
        user.verificationRequestedAt || null,
        user.verificationReviewedAt || null,
        user.isVerified ? 1 : 0,
        user.isAdmin ? 1 : 0,
        user.membership?.type || null,
        user.createdAt || null,
        user.updatedAt || null,
        JSON.stringify(user)
      );

      insertUserTags(insertTag, user.id, "tag", user.tags);
      insertUserTags(insertTag, user.id, "scene", user.sceneTags);
      insertUserTags(insertTag, user.id, "mode", user.matchModes);
    }

    const insertMatch = db.prepare(`
      INSERT INTO matches (
        id, participant_a, participant_b, participant_ids, identity_revealed,
        matched_at, last_message_at, updated_at, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const match of data.matches || []) {
      const participants = Array.isArray(match.participants) ? match.participants : [];
      insertMatch.run(
        match.id,
        participants[0] || null,
        participants[1] || null,
        JSON.stringify(participants),
        match.identityRevealed ? 1 : 0,
        match.matchedAt || null,
        match.lastMessageAt || null,
        match.updatedAt || null,
        JSON.stringify(match)
      );
    }

    const insertMessage = db.prepare(`
      INSERT INTO messages (
        id, match_id, sender_id, sender_nickname, type, content, created_at, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const [index, message] of (data.messages || []).entries()) {
      const sender = message.sender || {};
      insertMessage.run(
        message.id || message._id || `${message.matchId || message.match || "unknown"}:${index}`,
        message.matchId || message.match || null,
        message.senderId || sender.id || sender._id || null,
        sender.nickname || null,
        message.type || "text",
        message.content || null,
        message.createdAt || null,
        JSON.stringify(message)
      );
    }

    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // Ignore rollback errors caused by failures before BEGIN.
    }
    throw error;
  } finally {
    db.close();
    removeSqliteSidecars(dbPath);
  }
}

function insertUserTags(statement, userId, kind, values) {
  for (const value of Array.isArray(values) ? values : []) {
    statement.run(userId, kind, String(value));
  }
}

function removeSqliteSidecars(dbPath) {
  for (const suffix of ["-shm", "-wal"]) {
    try {
      fs.rmSync(`${dbPath}${suffix}`, { force: true });
    } catch {
      // The sidecar file may not exist, which is fine.
    }
  }
}
