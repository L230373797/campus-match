import fs from "node:fs";
import crypto from "node:crypto";
import mysql from "mysql2/promise";

const ENV_PATH = new URL("../.env.local", import.meta.url);
const API_BASE = process.env.ADMIN_FLOW_API_BASE || "http://127.0.0.1:3138/api";
const VERIFY_USER_ID = "user_admin_flow_verify";
const PRIVACY_USER_ID = "user_admin_flow_privacy";
const PRIVACY_REQUEST_ID = "privacy_admin_flow_test";

const env = loadEnv(ENV_PATH);

const connection = await mysql.createConnection({
  host: env.MYSQL_HOST || "127.0.0.1",
  port: Number(env.MYSQL_PORT || 3306),
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DATABASE,
  charset: "utf8mb4",
  dateStrings: true,
});

try {
  await upsertUser(connection, buildSmokeUser("verification"));
  await upsertUser(connection, buildSmokeUser("privacy"));
} finally {
  await connection.end();
}

let token = "";
const login = await api("/auth/login", {
  method: "POST",
  body: JSON.stringify({
    email: env.CAMPUS_ADMIN_EMAIL,
    password: env.CAMPUS_ADMIN_PASSWORD,
  }),
});
token = login.data.token;

const [pendingBefore, privacyBefore] = await Promise.all([
  api("/users/verification/pending"),
  api("/admin/privacy-requests"),
]);

const verificationVisibleBeforeReview = pendingBefore.data.users.some((user) => user.id === VERIFY_USER_ID);
const privacyVisibleBeforeReview = privacyBefore.data.requests.some((request) => (
  request.userId === PRIVACY_USER_ID
    && request.requestId === PRIVACY_REQUEST_ID
    && request.status === "pending"
));

const approved = await api("/users/verification/review", {
  method: "POST",
  body: JSON.stringify({
    userId: VERIFY_USER_ID,
    action: "approve",
    notes: "后台流程测试通过。",
  }),
});

const completedPrivacy = await api("/admin/privacy-requests/review", {
  method: "POST",
  body: JSON.stringify({
    userId: PRIVACY_USER_ID,
    requestId: PRIVACY_REQUEST_ID,
    status: "completed",
    notes: "后台流程测试已完成资料清空。",
  }),
});

const [pendingAfter, privacyAfter, overview, testUsers] = await Promise.all([
  api("/users/verification/pending"),
  api("/admin/privacy-requests"),
  api("/admin/overview"),
  api("/admin/users?q=admin-flow"),
]);

const testPrivacyAfter = privacyAfter.data.requests.find((request) => (
  request.userId === PRIVACY_USER_ID && request.requestId === PRIVACY_REQUEST_ID
));

const summary = {
  seededUsers: [VERIFY_USER_ID, PRIVACY_USER_ID],
  verificationVisibleBeforeReview,
  privacyVisibleBeforeReview,
  verificationReview: {
    message: approved.message,
    status: approved.data.user.verificationStatus,
    isVerified: approved.data.user.isVerified,
  },
  privacyReview: {
    message: completedPrivacy.message,
    status: completedPrivacy.data.request.status,
    requestUserNickname: completedPrivacy.data.request.userNickname,
  },
  pendingVerificationAfterReview: pendingAfter.data.users.length,
  testPrivacyStatusAfterReview: testPrivacyAfter?.status || "not-found",
  overviewCounts: overview.data.counts,
  testUsers: testUsers.data.users.map((user) => ({
    id: user.id,
    nickname: user.nickname,
    verificationStatus: user.verificationStatus,
    isVerified: user.isVerified,
    latestPrivacyStatus: user.latestPrivacyRequest?.status || "none",
  })),
};

console.log(JSON.stringify(summary, null, 2));

function loadEnv(fileUrl) {
  const text = fs.readFileSync(fileUrl, "utf8");
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${path} ${response.status}: ${payload.message || "请求失败"}`);
  }

  return payload;
}

function buildSmokeUser(kind) {
  const now = new Date().toISOString();
  const isPrivacyUser = kind === "privacy";
  const id = isPrivacyUser ? PRIVACY_USER_ID : VERIFY_USER_ID;

  return {
    id,
    _id: id,
    email: isPrivacyUser ? "admin-flow-privacy@qq.com" : "admin-flow-verify@qq.com",
    studentId: isPrivacyUser ? "ADMIN-FLOW-PRIVACY" : "ADMIN-FLOW-VERIFY",
    nickname: isPrivacyUser ? "后台资料请求测试账号" : "后台认证测试账号",
    school: "本地测试大学",
    grade: "2026级",
    major: isPrivacyUser ? "资料安全测试" : "运营流程测试",
    college: "产品体验学院",
    campusZone: "主校区",
    dormArea: "测试宿舍 A 区",
    mbti: isPrivacyUser ? "INFJ" : "ENFP",
    birthDate: isPrivacyUser ? "2002-05-04" : "2001-09-01",
    bio: "用于本地验证管理端流程的测试账号。",
    tags: ["后台测试", "流程验证"],
    sceneTags: ["图书馆", "自习搭子"],
    matchModes: ["同校匹配"],
    schedule: "晚间在线",
    idealScene: "一起验证功能是否顺手",
    relationshipGoal: "低压力认识彼此",
    allowAnonymousMatch: true,
    allowOfflineEvents: true,
    campusCardImage: "/dingfang-example.jpg",
    avatar: "",
    isVerified: false,
    verificationStatus: "pending",
    verificationBadge: "本地测试大学 认证审核中",
    verificationRequestedAt: now,
    verificationReviewedAt: null,
    verificationNotes: "",
    membership: defaultMembership(now),
    stats: { matches: 0, likes: 0, views: 0 },
    skippedIds: [],
    dismissedLikedIds: [],
    dismissedRecommendationSignals: [],
    privacyRequests: isPrivacyUser ? [{
      id: PRIVACY_REQUEST_ID,
      type: "delete_profile",
      typeLabel: "清空资料",
      reason: "后台流程测试：用户申请清空个人资料。",
      status: "pending",
      statusLabel: "待处理",
      requestedAt: now,
      reviewedAt: null,
      completedAt: null,
      cancelledAt: null,
      reviewedBy: "",
      notes: "",
    }] : [],
    privacyRequestStatus: isPrivacyUser ? "pending" : "none",
    accountStatus: "active",
    createdAt: now,
    updatedAt: now,
    isAdmin: false,
    ...hashPassword("FlowTest@2026"),
  };
}

function defaultMembership(now) {
  return {
    type: "free",
    planId: "free",
    title: "免费用户",
    status: "active",
    billingCycle: null,
    price: 0,
    currency: "CNY",
    startedAt: now,
    expiresAt: null,
    renewedAt: now,
    autoRenew: false,
    description: "先用基础功能体验真实校园连接。",
    features: ["每日 12 条推荐", "基础同校匹配", "校园认证与资料完善"],
    limits: { recommendationWindow: 12, advancedFilters: false, spotlight: false },
  };
}

function hashPassword(password) {
  const passwordSalt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.scryptSync(password, passwordSalt, 64).toString("hex");
  return { passwordHash, passwordSalt };
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
    user.allowAnonymousMatch !== false ? 1 : 0,
    user.allowOfflineEvents !== false ? 1 : 0,
    user.campusCardImage || null,
    user.avatar || null,
    user.isVerified ? 1 : 0,
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
    user.isAdmin ? 1 : 0,
    user.passwordHash || null,
    user.passwordSalt || null,
    toMysqlDateTime(user.createdAt),
    toMysqlDateTime(user.updatedAt),
    jsonString(user),
  ]);
}

function toMysqlDate(value) {
  const raw = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function toMysqlDateTime(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 23).replace("T", " ");
}

function jsonString(value) {
  return JSON.stringify(value ?? null);
}
