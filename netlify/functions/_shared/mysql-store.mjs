import fs from "node:fs";
import mysql from "mysql2/promise";

let pool;
let schemaReady = false;
let poolSignature = "";

export async function createDataStore({ blobStore, env }) {
  const config = getMysqlConfig(env);
  if (!config) {
    return new BlobStoreWrapper(blobStore);
  }

  const mysqlPool = await getPool(config);
  await ensureSchema(mysqlPool, config.database);
  return new MysqlStore(mysqlPool, blobStore);
}

function getMysqlConfig(env) {
  const host = env("MYSQL_HOST");
  const user = env("MYSQL_USER");
  const password = env("MYSQL_PASSWORD");
  const database = env("MYSQL_DATABASE");

  if (!host || !user || !password || !database) {
    return null;
  }

  return {
    host,
    user,
    password,
    database,
    port: Number(env("MYSQL_PORT") || 3306),
    ssl: getMysqlSslConfig(env),
  };
}

function getMysqlSslConfig(env) {
  const enabled = String(env("MYSQL_SSL") || "").trim().toLowerCase();
  if (!["1", "true", "required", "require"].includes(enabled)) {
    return undefined;
  }

  const ca = env("MYSQL_SSL_CA") || readOptionalFile(env("MYSQL_SSL_CA_PATH"));
  return {
    rejectUnauthorized: String(env("MYSQL_SSL_REJECT_UNAUTHORIZED") || "true").toLowerCase() !== "false",
    ...(ca ? { ca } : {}),
  };
}

function readOptionalFile(filePath) {
  if (!filePath) {
    return "";
  }

  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

async function getPool(config) {
  const signature = JSON.stringify(config);
  if (!pool || poolSignature !== signature) {
    if (pool) {
      await pool.end();
    }

    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      charset: "utf8mb4",
      dateStrings: true,
      ssl: config.ssl,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
    poolSignature = signature;
    schemaReady = false;
  }

  return pool;
}

async function ensureSchema(pool, database) {
  if (schemaReady) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_meta (
      meta_key VARCHAR(100) PRIMARY KEY,
      meta_value JSON NULL,
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(80) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      student_id VARCHAR(120) NULL,
      nickname VARCHAR(255) NOT NULL,
      school VARCHAR(255) NULL,
      grade VARCHAR(120) NULL,
      major VARCHAR(255) NULL,
      college VARCHAR(255) NULL,
      campus_zone VARCHAR(255) NULL,
      dorm_area VARCHAR(255) NULL,
      mbti VARCHAR(4) NULL,
      birth_date DATE NULL,
      bio TEXT NULL,
      schedule_text TEXT NULL,
      ideal_scene TEXT NULL,
      relationship_goal TEXT NULL,
      allow_anonymous_match TINYINT(1) NOT NULL DEFAULT 1,
      allow_offline_events TINYINT(1) NOT NULL DEFAULT 1,
      campus_card_image TEXT NULL,
      avatar TEXT NULL,
      is_verified TINYINT(1) NOT NULL DEFAULT 0,
      verification_status VARCHAR(32) NOT NULL DEFAULT 'unverified',
      verification_badge VARCHAR(255) NULL,
      verification_requested_at DATETIME(3) NULL,
      verification_reviewed_at DATETIME(3) NULL,
      verification_notes TEXT NULL,
      membership_json JSON NULL,
      stats_json JSON NULL,
      tags_json JSON NULL,
      scene_tags_json JSON NULL,
      match_modes_json JSON NULL,
      skipped_ids_json JSON NULL,
      is_admin TINYINT(1) NOT NULL DEFAULT 0,
      password_hash TEXT NULL,
      password_salt VARCHAR(255) NULL,
      created_at DATETIME(3) NULL,
      updated_at DATETIME(3) NULL,
      raw_json JSON NULL,
      INDEX users_school_idx (school),
      INDEX users_major_idx (major),
      INDEX users_grade_idx (grade),
      INDEX users_mbti_idx (mbti),
      INDEX users_birth_date_idx (birth_date),
      INDEX users_verification_idx (verification_status),
      INDEX users_is_admin_idx (is_admin)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_verification_codes (
      email VARCHAR(255) PRIMARY KEY,
      code_hash VARCHAR(255) NOT NULL,
      requested_at DATETIME(3) NOT NULL,
      expires_at DATETIME(3) NOT NULL,
      attempts INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token VARCHAR(128) PRIMARY KEY,
      user_id VARCHAR(80) NOT NULL,
      expires_at DATETIME(3) NOT NULL,
      created_at DATETIME(3) NOT NULL,
      INDEX sessions_user_idx (user_id),
      INDEX sessions_expiry_idx (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS matches (
      id VARCHAR(80) PRIMARY KEY,
      pair_key VARCHAR(255) NOT NULL UNIQUE,
      participant_a VARCHAR(80) NOT NULL,
      participant_b VARCHAR(80) NOT NULL,
      participant_ids_json JSON NOT NULL,
      user_snapshots_json JSON NULL,
      reveal_requests_json JSON NULL,
      identity_revealed TINYINT(1) NOT NULL DEFAULT 0,
      matched_at DATETIME(3) NULL,
      last_message_at DATETIME(3) NULL,
      created_at DATETIME(3) NULL,
      updated_at DATETIME(3) NULL,
      raw_json JSON NULL,
      INDEX matches_last_message_idx (last_message_at),
      INDEX matches_participant_a_idx (participant_a),
      INDEX matches_participant_b_idx (participant_b)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(120) PRIMARY KEY,
      match_id VARCHAR(80) NOT NULL,
      sender_id VARCHAR(80) NULL,
      sender_nickname VARCHAR(255) NULL,
      message_type VARCHAR(32) NOT NULL DEFAULT 'text',
      content TEXT NULL,
      created_at DATETIME(3) NULL,
      raw_json JSON NULL,
      INDEX messages_match_idx (match_id),
      INDEX messages_sender_idx (sender_id),
      INDEX messages_created_idx (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await ensureUserSchemaCompatibility(pool, database);
  await ensureDashboardTables(pool);
  await refreshDashboardTables(pool);

  schemaReady = true;
}

async function ensureUserSchemaCompatibility(pool, database) {
  await ensureColumn(pool, database, "users", "mbti", "VARCHAR(4) NULL AFTER dorm_area");
  await ensureColumn(pool, database, "users", "birth_date", "DATE NULL AFTER mbti");
  await ensureIndex(pool, database, "users", "users_mbti_idx", "CREATE INDEX users_mbti_idx ON users (mbti)");
  await ensureIndex(pool, database, "users", "users_birth_date_idx", "CREATE INDEX users_birth_date_idx ON users (birth_date)");
}

async function ensureColumn(pool, database, table, column, definition) {
  const [rows] = await pool.execute(`
    SELECT COUNT(*) AS count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
  `, [database, table, column]);

  if (Number(rows?.[0]?.count || 0) > 0) {
    return;
  }

  await pool.query(`ALTER TABLE ${quoteIdentifier(table)} ADD COLUMN ${quoteIdentifier(column)} ${definition}`);
}

async function ensureIndex(pool, database, table, indexName, createSql) {
  const [rows] = await pool.execute(`
    SELECT COUNT(*) AS count
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?
  `, [database, table, indexName]);

  if (Number(rows?.[0]?.count || 0) > 0) {
    return;
  }

  await pool.query(createSql);
}

async function ensureDashboardTables(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`看板_用户列表\` (
      \`用户ID\` VARCHAR(80) PRIMARY KEY,
      \`邮箱\` VARCHAR(255) NULL,
      \`昵称\` VARCHAR(255) NULL,
      \`学校\` VARCHAR(255) NULL,
      \`年级\` VARCHAR(120) NULL,
      \`专业\` VARCHAR(255) NULL,
      \`学院\` VARCHAR(255) NULL,
      \`MBTI\` VARCHAR(4) NULL,
      \`生日\` DATE NULL,
      \`认证状态\` VARCHAR(32) NULL,
      \`会员类型\` VARCHAR(64) NULL,
      \`是否管理员\` VARCHAR(8) NULL,
      \`注册时间\` DATETIME(3) NULL,
      \`更新时间\` DATETIME(3) NULL,
      INDEX \`看板用户学校索引\` (\`学校\`),
      INDEX \`看板用户认证索引\` (\`认证状态\`),
      INDEX \`看板用户更新时间索引\` (\`更新时间\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`看板_匹配记录\` (
      \`匹配ID\` VARCHAR(80) PRIMARY KEY,
      \`用户A昵称\` VARCHAR(255) NULL,
      \`用户A邮箱\` VARCHAR(255) NULL,
      \`用户B昵称\` VARCHAR(255) NULL,
      \`用户B邮箱\` VARCHAR(255) NULL,
      \`是否已互相展示身份\` VARCHAR(8) NULL,
      \`匹配时间\` DATETIME(3) NULL,
      \`最后消息时间\` DATETIME(3) NULL,
      INDEX \`看板匹配最后消息索引\` (\`最后消息时间\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`看板_聊天记录\` (
      \`消息ID\` VARCHAR(120) PRIMARY KEY,
      \`匹配ID\` VARCHAR(80) NULL,
      \`发送人昵称\` VARCHAR(255) NULL,
      \`发送人邮箱\` VARCHAR(255) NULL,
      \`消息类型\` VARCHAR(32) NULL,
      \`内容\` TEXT NULL,
      \`发送时间\` DATETIME(3) NULL,
      INDEX \`看板聊天匹配索引\` (\`匹配ID\`),
      INDEX \`看板聊天时间索引\` (\`发送时间\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`看板_待认证用户\` (
      \`用户ID\` VARCHAR(80) PRIMARY KEY,
      \`邮箱\` VARCHAR(255) NULL,
      \`昵称\` VARCHAR(255) NULL,
      \`学校\` VARCHAR(255) NULL,
      \`年级\` VARCHAR(120) NULL,
      \`专业\` VARCHAR(255) NULL,
      \`认证状态\` VARCHAR(32) NULL,
      \`提交时间\` DATETIME(3) NULL,
      \`校园卡图片\` TEXT NULL,
      INDEX \`看板待认证提交时间索引\` (\`提交时间\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`看板_会员概览\` (
      \`用户ID\` VARCHAR(80) PRIMARY KEY,
      \`邮箱\` VARCHAR(255) NULL,
      \`昵称\` VARCHAR(255) NULL,
      \`会员类型\` VARCHAR(64) NULL,
      \`会员状态\` VARCHAR(64) NULL,
      \`到期时间\` VARCHAR(80) NULL,
      \`更新时间\` DATETIME(3) NULL,
      INDEX \`看板会员类型索引\` (\`会员类型\`),
      INDEX \`看板会员状态索引\` (\`会员状态\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

class MysqlStore {
  constructor(pool, blobStore) {
    this.kind = "mysql";
    this.pool = pool;
    this.blobStore = blobStore;
  }

  async get(key, options = {}) {
    if (key.startsWith("uploads/")) {
      return this.blobStore.get(key, options);
    }

    if (key.startsWith("users/")) {
      const userId = key.slice("users/".length);
      const [rows] = await this.pool.execute("SELECT raw_json FROM users WHERE id = ? LIMIT 1", [userId]);
      return parseRawJson(rows[0]?.raw_json);
    }

    if (key.startsWith("email/")) {
      const email = decodeURIComponent(key.slice("email/".length));
      const [rows] = await this.pool.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
      return rows[0]?.id ? { userId: rows[0].id } : null;
    }

    if (key.startsWith("sessions/")) {
      const token = key.slice("sessions/".length);
      const [rows] = await this.pool.execute(
        "SELECT token, user_id, expires_at, created_at FROM sessions WHERE token = ? LIMIT 1",
        [token]
      );
      if (!rows[0]) {
        return null;
      }

      return {
        token: rows[0].token,
        userId: rows[0].user_id,
        expiresAt: toIsoString(rows[0].expires_at),
        createdAt: toIsoString(rows[0].created_at),
      };
    }

    if (key.startsWith("matches/")) {
      const matchId = key.slice("matches/".length);
      const [rows] = await this.pool.execute("SELECT raw_json FROM matches WHERE id = ? LIMIT 1", [matchId]);
      return parseRawJson(rows[0]?.raw_json);
    }

    if (key.startsWith("match-pairs/")) {
      const pairKey = key.slice("match-pairs/".length);
      const [rows] = await this.pool.execute("SELECT id FROM matches WHERE pair_key = ? LIMIT 1", [pairKey]);
      return rows[0]?.id ? { matchId: rows[0].id } : null;
    }

    if (key.startsWith("messages/")) {
      const matchId = key.slice("messages/".length);
      const [rows] = await this.pool.execute(
        "SELECT raw_json FROM messages WHERE match_id = ? ORDER BY created_at ASC, id ASC",
        [matchId]
      );
      return rows.map((row) => parseRawJson(row.raw_json)).filter(Boolean);
    }

    if (key.startsWith("email-codes/")) {
      const email = decodeURIComponent(key.slice("email-codes/".length));
      const [rows] = await this.pool.execute(
        "SELECT email, code_hash, requested_at, expires_at, attempts FROM email_verification_codes WHERE email = ? LIMIT 1",
        [email]
      );
      if (!rows[0]) {
        return null;
      }

      return {
        email: rows[0].email,
        codeHash: rows[0].code_hash,
        requestedAt: toIsoString(rows[0].requested_at),
        expiresAt: toIsoString(rows[0].expires_at),
        attempts: rows[0].attempts,
      };
    }

    return this.blobStore.get(key, options);
  }

  async setJSON(key, value) {
    if (key.startsWith("users/")) {
      await upsertUser(this.pool, value);
      return;
    }

    if (key.startsWith("email/")) {
      return;
    }

    if (key.startsWith("sessions/")) {
      await this.pool.execute(`
        INSERT INTO sessions (token, user_id, expires_at, created_at)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          user_id = VALUES(user_id),
          expires_at = VALUES(expires_at),
          created_at = VALUES(created_at)
      `, [
        value.token,
        value.userId,
        toMysqlDateTime(value.expiresAt),
        toMysqlDateTime(value.createdAt),
      ]);
      return;
    }

    if (key.startsWith("matches/")) {
      await upsertMatch(this.pool, value);
      return;
    }

    if (key.startsWith("match-pairs/")) {
      const pairKey = key.slice("match-pairs/".length);
      await this.pool.execute("UPDATE matches SET pair_key = ? WHERE id = ?", [pairKey, value.matchId]);
      return;
    }

    if (key.startsWith("messages/")) {
      const matchId = key.slice("messages/".length);
      await replaceMessages(this.pool, matchId, Array.isArray(value) ? value : []);
      return;
    }

    if (key.startsWith("email-codes/")) {
      await this.pool.execute(`
        INSERT INTO email_verification_codes (email, code_hash, requested_at, expires_at, attempts)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          code_hash = VALUES(code_hash),
          requested_at = VALUES(requested_at),
          expires_at = VALUES(expires_at),
          attempts = VALUES(attempts)
      `, [
        value.email,
        value.codeHash,
        toMysqlDateTime(value.requestedAt),
        toMysqlDateTime(value.expiresAt),
        Number(value.attempts || 0),
      ]);
      return;
    }

    await this.blobStore.setJSON(key, value);
  }

  async set(key, value) {
    if (key.startsWith("uploads/")) {
      return this.blobStore.set(key, value);
    }

    throw new Error(`Binary writes are not supported for key: ${key}`);
  }

  async delete(key) {
    if (key.startsWith("uploads/")) {
      return this.blobStore.delete(key);
    }

    if (key.startsWith("messages/")) {
      const matchId = key.slice("messages/".length);
      await this.pool.execute("DELETE FROM messages WHERE match_id = ?", [matchId]);
      await refreshDashboardTables(this.pool);
      return;
    }

    if (key.startsWith("email-codes/")) {
      const email = decodeURIComponent(key.slice("email-codes/".length));
      await this.pool.execute("DELETE FROM email_verification_codes WHERE email = ?", [email]);
      return;
    }

    if (key.startsWith("sessions/")) {
      const token = key.slice("sessions/".length);
      await this.pool.execute("DELETE FROM sessions WHERE token = ?", [token]);
      return;
    }

    await this.blobStore.delete(key);
  }

  async list({ prefix, cursor } = {}) {
    if (!prefix) {
      return { blobs: [], cursor: null };
    }

    if (prefix.startsWith("users/")) {
      const { limit, offset } = decodeCursor(cursor);
      const [rows] = await this.pool.query(`SELECT id FROM users ORDER BY created_at DESC, id DESC LIMIT ${limit} OFFSET ${offset}`);
      return buildListResult(rows.map((row) => `users/${row.id}`), rows.length, limit, offset);
    }

    if (prefix.startsWith("matches/")) {
      const { limit, offset } = decodeCursor(cursor);
      const [rows] = await this.pool.query(`SELECT id FROM matches ORDER BY updated_at DESC, id DESC LIMIT ${limit} OFFSET ${offset}`);
      return buildListResult(rows.map((row) => `matches/${row.id}`), rows.length, limit, offset);
    }

    if (prefix.startsWith("messages/")) {
      const { limit, offset } = decodeCursor(cursor);
      const [rows] = await this.pool.query(
        `SELECT DISTINCT match_id FROM messages ORDER BY match_id ASC LIMIT ${limit} OFFSET ${offset}`
      );
      return buildListResult(rows.map((row) => `messages/${row.match_id}`), rows.length, limit, offset);
    }

    return this.blobStore.list({ prefix, cursor });
  }
}

class BlobStoreWrapper {
  constructor(blobStore) {
    this.kind = "blobs";
    this.blobStore = blobStore;
  }

  get(...args) {
    return this.blobStore.get(...args);
  }

  setJSON(...args) {
    return this.blobStore.setJSON(...args);
  }

  set(...args) {
    return this.blobStore.set(...args);
  }

  delete(...args) {
    return this.blobStore.delete(...args);
  }

  list(...args) {
    return this.blobStore.list(...args);
  }
}

async function upsertUser(pool, user) {
  await pool.execute(`
    INSERT INTO users (
      id, email, student_id, nickname, school, grade, major, college, campus_zone, dorm_area,
      mbti, birth_date, bio, schedule_text, ideal_scene, relationship_goal, allow_anonymous_match, allow_offline_events,
      campus_card_image, avatar, is_verified, verification_status, verification_badge,
      verification_requested_at, verification_reviewed_at, verification_notes, membership_json, stats_json,
      tags_json, scene_tags_json, match_modes_json, skipped_ids_json, is_admin, password_hash,
      password_salt, created_at, updated_at, raw_json
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON),
      CAST(? AS JSON), CAST(? AS JSON), CAST(? AS JSON), CAST(? AS JSON), ?, ?,
      ?, ?, ?, CAST(? AS JSON)
    )
    ON DUPLICATE KEY UPDATE
      email = VALUES(email),
      student_id = VALUES(student_id),
      nickname = VALUES(nickname),
      school = VALUES(school),
      grade = VALUES(grade),
      major = VALUES(major),
      college = VALUES(college),
      campus_zone = VALUES(campus_zone),
      dorm_area = VALUES(dorm_area),
      mbti = VALUES(mbti),
      birth_date = VALUES(birth_date),
      bio = VALUES(bio),
      schedule_text = VALUES(schedule_text),
      ideal_scene = VALUES(ideal_scene),
      relationship_goal = VALUES(relationship_goal),
      allow_anonymous_match = VALUES(allow_anonymous_match),
      allow_offline_events = VALUES(allow_offline_events),
      campus_card_image = VALUES(campus_card_image),
      avatar = VALUES(avatar),
      is_verified = VALUES(is_verified),
      verification_status = VALUES(verification_status),
      verification_badge = VALUES(verification_badge),
      verification_requested_at = VALUES(verification_requested_at),
      verification_reviewed_at = VALUES(verification_reviewed_at),
      verification_notes = VALUES(verification_notes),
      membership_json = VALUES(membership_json),
      stats_json = VALUES(stats_json),
      tags_json = VALUES(tags_json),
      scene_tags_json = VALUES(scene_tags_json),
      match_modes_json = VALUES(match_modes_json),
      skipped_ids_json = VALUES(skipped_ids_json),
      is_admin = VALUES(is_admin),
      password_hash = VALUES(password_hash),
      password_salt = VALUES(password_salt),
      created_at = VALUES(created_at),
      updated_at = VALUES(updated_at),
      raw_json = VALUES(raw_json)
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
    user.mbti || null,
    toMysqlDate(user.birthDate || user.birthday),
    user.bio || null,
    user.schedule || null,
    user.idealScene || null,
    user.relationshipGoal || null,
    toInt(user.allowAnonymousMatch !== false),
    toInt(user.allowOfflineEvents !== false),
    user.campusCardImage || null,
    user.avatar || null,
    toInt(Boolean(user.isVerified)),
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
    toInt(Boolean(user.isAdmin)),
    user.passwordHash || null,
    user.passwordSalt || null,
    toMysqlDateTime(user.createdAt),
    toMysqlDateTime(user.updatedAt),
    jsonString(user),
  ]);
  await refreshDashboardTables(pool);
}

async function upsertMatch(pool, match) {
  const participants = Array.isArray(match.participants) ? match.participants : [];
  await pool.execute(`
    INSERT INTO matches (
      id, pair_key, participant_a, participant_b, participant_ids_json, user_snapshots_json,
      reveal_requests_json, identity_revealed, matched_at, last_message_at, created_at, updated_at, raw_json
    ) VALUES (
      ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON),
      CAST(? AS JSON), ?, ?, ?, ?, ?, CAST(? AS JSON)
    )
    ON DUPLICATE KEY UPDATE
      pair_key = VALUES(pair_key),
      participant_a = VALUES(participant_a),
      participant_b = VALUES(participant_b),
      participant_ids_json = VALUES(participant_ids_json),
      user_snapshots_json = VALUES(user_snapshots_json),
      reveal_requests_json = VALUES(reveal_requests_json),
      identity_revealed = VALUES(identity_revealed),
      matched_at = VALUES(matched_at),
      last_message_at = VALUES(last_message_at),
      created_at = VALUES(created_at),
      updated_at = VALUES(updated_at),
      raw_json = VALUES(raw_json)
  `, [
    match.id,
    pairKeyFromParticipants(participants),
    participants[0] || "",
    participants[1] || "",
    jsonString(participants),
    jsonString(match.userSnapshots || null),
    jsonString(match.revealRequests || []),
    toInt(Boolean(match.identityRevealed)),
    toMysqlDateTime(match.matchedAt),
    toMysqlDateTime(match.lastMessageAt),
    toMysqlDateTime(match.createdAt),
    toMysqlDateTime(match.updatedAt),
    jsonString(match),
  ]);
  await refreshDashboardTables(pool);
}

async function replaceMessages(pool, matchId, messages) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("DELETE FROM messages WHERE match_id = ?", [matchId]);
    for (const [index, message] of messages.entries()) {
      const sender = message.sender || {};
      await connection.execute(`
        INSERT INTO messages (
          id, match_id, sender_id, sender_nickname, message_type, content, created_at, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON))
      `, [
        message.id || message._id || `${matchId}:${index}`,
        matchId,
        message.senderId || sender.id || sender._id || null,
        sender.nickname || null,
        message.type || "text",
        message.content || null,
        toMysqlDateTime(message.createdAt),
        jsonString(message),
      ]);
    }
    await connection.commit();
    await refreshDashboardTables(pool);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function refreshDashboardTables(pool) {
  const dashboardTables = [
    "看板_会员概览",
    "看板_待认证用户",
    "看板_聊天记录",
    "看板_匹配记录",
    "看板_用户列表",
  ];

  for (const table of dashboardTables) {
    await pool.query(`DELETE FROM ${quoteIdentifier(table)}`);
  }

  await pool.query(`
    INSERT INTO \`看板_用户列表\` (
      \`用户ID\`, \`邮箱\`, \`昵称\`, \`学校\`, \`年级\`, \`专业\`, \`学院\`,
      \`MBTI\`, \`生日\`, \`认证状态\`, \`会员类型\`, \`是否管理员\`, \`注册时间\`, \`更新时间\`
    )
    SELECT
      id,
      email,
      nickname,
      school,
      grade,
      major,
      college,
      mbti,
      birth_date,
      verification_status,
      COALESCE(
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(membership_json, '$.planId')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(membership_json, '$.type')), 'null'),
        'free'
      ) AS membership_type,
      CASE WHEN is_admin = 1 THEN '是' ELSE '否' END,
      created_at,
      updated_at
    FROM users
    ORDER BY updated_at DESC, created_at DESC
  `);

  await pool.query(`
    INSERT INTO \`看板_匹配记录\` (
      \`匹配ID\`, \`用户A昵称\`, \`用户A邮箱\`, \`用户B昵称\`, \`用户B邮箱\`,
      \`是否已互相展示身份\`, \`匹配时间\`, \`最后消息时间\`
    )
    SELECT
      m.id,
      ua.nickname,
      ua.email,
      ub.nickname,
      ub.email,
      CASE WHEN m.identity_revealed = 1 THEN '是' ELSE '否' END,
      m.matched_at,
      m.last_message_at
    FROM matches m
    LEFT JOIN users ua ON ua.id = m.participant_a
    LEFT JOIN users ub ON ub.id = m.participant_b
    ORDER BY m.last_message_at DESC, m.matched_at DESC
  `);

  await pool.query(`
    INSERT INTO \`看板_聊天记录\` (
      \`消息ID\`, \`匹配ID\`, \`发送人昵称\`, \`发送人邮箱\`, \`消息类型\`, \`内容\`, \`发送时间\`
    )
    SELECT
      msg.id,
      msg.match_id,
      COALESCE(sender.nickname, msg.sender_nickname),
      sender.email,
      msg.message_type,
      msg.content,
      msg.created_at
    FROM messages msg
    LEFT JOIN users sender ON sender.id = msg.sender_id
    ORDER BY msg.created_at DESC
  `);

  await pool.query(`
    INSERT INTO \`看板_待认证用户\` (
      \`用户ID\`, \`邮箱\`, \`昵称\`, \`学校\`, \`年级\`, \`专业\`,
      \`认证状态\`, \`提交时间\`, \`校园卡图片\`
    )
    SELECT
      id,
      email,
      nickname,
      school,
      grade,
      major,
      verification_status,
      verification_requested_at,
      campus_card_image
    FROM users
    WHERE verification_status IN ('pending', 'rejected')
    ORDER BY verification_requested_at DESC, updated_at DESC
  `);

  await pool.query(`
    INSERT INTO \`看板_会员概览\` (
      \`用户ID\`, \`邮箱\`, \`昵称\`, \`会员类型\`, \`会员状态\`, \`到期时间\`, \`更新时间\`
    )
    SELECT
      id,
      email,
      nickname,
      COALESCE(
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(membership_json, '$.planId')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(membership_json, '$.type')), 'null'),
        'free'
      ) AS membership_type,
      COALESCE(
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(membership_json, '$.status')), 'null'),
        'active'
      ) AS membership_status,
      COALESCE(
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(membership_json, '$.expiresAt')), 'null'),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(membership_json, '$.expiredAt')), 'null')
      ) AS expires_at,
      updated_at
    FROM users
    ORDER BY updated_at DESC
  `);
}

function pairKeyFromParticipants(participants) {
  return [...participants].sort().join("__");
}

function parseRawJson(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return value;
}

function jsonString(value) {
  return JSON.stringify(value ?? null);
}

function toIsoString(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2} /.test(value)) {
    return new Date(value.replace(" ", "T") + "Z").toISOString();
  }

  return new Date(value).toISOString();
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
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function toMysqlDate(value) {
  if (!value) {
    return null;
  }

  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toInt(value) {
  return value ? 1 : 0;
}

function quoteIdentifier(value) {
  return `\`${String(value).replace(/`/g, "``")}\``;
}

function decodeCursor(cursor) {
  const limit = 100;
  if (!cursor) {
    return { limit, offset: 0 };
  }

  const offset = Number.parseInt(Buffer.from(String(cursor), "base64url").toString("utf8"), 10);
  return {
    limit,
    offset: Number.isFinite(offset) && offset >= 0 ? offset : 0,
  };
}

function buildListResult(keys, rowCount, limit, offset) {
  const nextOffset = offset + rowCount;
  return {
    blobs: keys.map((key) => ({ key })),
    cursor: rowCount === limit ? Buffer.from(String(nextOffset), "utf8").toString("base64url") : null,
  };
}
