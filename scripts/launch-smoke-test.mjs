import fs from "node:fs/promises";
import path from "node:path";
import apiHandler from "../netlify/functions/api.mjs";
import { createLocalBlobStore } from "../server/local-blob-store.mjs";

for (const key of [
  "MYSQL_HOST",
  "MYSQL_PORT",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
  "MYSQL_DATABASE",
  "QQ_SMTP_USER",
  "QQ_SMTP_AUTH_CODE",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_HOST",
  "EMAIL_VERIFICATION_DEBUG",
  "EMAIL_VERIFICATION_REQUIRED",
]) {
  delete process.env[key];
}

const root = path.resolve("output/launch-smoke-test");
const reportPath = path.resolve("output/launch-smoke-test-report.json");
await fs.rm(root, { recursive: true, force: true });
await fs.mkdir(path.dirname(reportPath), { recursive: true });

const blobStore = createLocalBlobStore(root);
const stamp = Date.now();
const results = [];
const state = {};

await check("health endpoint", async () => {
  const payload = await call("/health");
  assert(payload.data?.status === "ok", "health status should be ok");
});

await check("register user, peer, and operator", async () => {
  state.user = await registerUser("user", {
    nickname: "Launch User",
    school: "北京大学",
    major: "计算机科学",
    grade: "大三",
  });
  state.peer = await registerUser("peer", {
    nickname: "Launch Peer",
    school: "北京大学",
    major: "法学",
    grade: "大二",
  });
  state.operator = await registerUser("operator", {
    nickname: "Launch Operator",
    school: "北京大学",
    major: "运营",
    grade: "研一",
  });

  const operatorRecord = await blobStore.get(`users/${state.operator.user.id}`, { type: "json" });
  await blobStore.setJSON(`users/${state.operator.user.id}`, {
    ...operatorRecord,
    isAdmin: true,
    updatedAt: new Date().toISOString(),
  });
});

await check("login with registered account", async () => {
  const payload = await call("/auth/login", {
    method: "POST",
    body: { email: state.user.email, password: passwordFor("user") },
  });
  assert(payload.data?.token, "login should return a token");
  state.user.token = payload.data.token;
});

await check("profile read and update", async () => {
  const profile = await call("/users/profile", { token: state.user.token });
  assert(profile.data?.user?.email === state.user.email, "profile email should match");

  const updated = await call("/users/profile", {
    method: "PUT",
    token: state.user.token,
    body: {
      bio: "Launch smoke profile",
      sceneTags: ["图书馆", "夜跑"],
      matchModes: ["学习搭子", "散步搭子"],
      allowAnonymousMatch: true,
      allowOfflineEvents: true,
    },
  });
  assert(updated.data?.user?.bio === "Launch smoke profile", "profile update should persist");
});

await check("membership read and subscribe", async () => {
  const current = await call("/membership", { token: state.user.token });
  assert(Array.isArray(current.data?.plans), "membership plans should exist");

  const subscribed = await call("/membership/subscribe", {
    method: "POST",
    token: state.user.token,
    body: { planId: "plus", billingCycle: "monthly" },
  });
  assert(subscribed.data?.membership?.planId === "plus", "plus membership should activate");
});

await check("campus card upload", async () => {
  const uploaded = await call("/uploads/campus-card", {
    method: "POST",
    token: state.user.token,
    body: {
      contentType: "image/png",
      data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    },
  });
  assert(uploaded.data?.imageUrl?.startsWith("/api/uploads/campus-cards/"), "upload should return image URL");
});

await check("avatar upload and profile persistence", async () => {
  const uploaded = await call("/uploads/avatar", {
    method: "POST",
    token: state.user.token,
    body: {
      contentType: "image/png",
      data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    },
  });
  assert(uploaded.data?.imageUrl?.startsWith("/api/uploads/avatars/"), "avatar upload should return image URL");
  assert(uploaded.data?.user?.avatar === uploaded.data.imageUrl, "avatar should be written to returned user");
  state.user.user = uploaded.data.user;

  const me = await call("/auth/me", { token: state.user.token });
  assert(me.data?.user?.avatar === uploaded.data.imageUrl, "avatar should persist on profile");

  const imageResponse = await apiHandler(new Request(`http://launch.local${uploaded.data.imageUrl}`), { blobStore });
  assert(imageResponse.ok, "avatar image should be readable");
  assert(imageResponse.headers.get("content-type") === "image/png", "avatar image should keep image content type");
});

await check("operator reviews campus verification", async () => {
  const pending = await call("/users/verification/pending", { token: state.operator.token });
  assert(
    pending.data?.users?.some((user) => (user.id || user._id) === state.user.user.id),
    "uploaded user should appear in verification queue",
  );

  const reviewed = await call("/users/verification/review", {
    method: "POST",
    token: state.operator.token,
    body: {
      userId: state.user.user.id,
      action: "approve",
      notes: "Launch smoke verification approved",
    },
  });
  assert(reviewed.data?.user?.verificationStatus === "approved", "verification should be approved");
});

await check("recommendation and match flow", async () => {
  const recommendations = await call("/users/recommendations?limit=10", { token: state.peer.token });
  assert(Array.isArray(recommendations.data?.users), "recommendations should return a list");

  const liked = await call(`/matches/like/${state.user.user.id}`, {
    method: "POST",
    token: state.peer.token,
  });
  assert(liked.data?.match?.id, "like should create a match");
  state.matchId = liked.data.match.id;

  const matches = await call("/matches", { token: state.peer.token });
  assert(matches.data?.matches?.some((match) => match.id === state.matchId), "match list should include new match");
});

await check("chat and identity reveal flow", async () => {
  const sent = await call(`/messages/${state.matchId}`, {
    method: "POST",
    token: state.peer.token,
    body: { content: "Launch smoke hello" },
  });
  assert(sent.data?.message?.content === "Launch smoke hello", "message should be saved");

  const messages = await call(`/messages/${state.matchId}`, { token: state.peer.token });
  assert(messages.data?.messages?.some((message) => message.content === "Launch smoke hello"), "message list should include sent message");

  const reveal = await call(`/matches/${state.matchId}/reveal`, {
    method: "POST",
    token: state.peer.token,
  });
  assert(typeof reveal.data?.bothRevealed === "boolean", "reveal request should return state");
});

await check("privacy request submit, cancel, and operator reject", async () => {
  const first = await call("/users/privacy-requests", {
    method: "POST",
    token: state.peer.token,
    body: { type: "delete_profile", reason: "Launch smoke cancel" },
  });
  assert(first.data?.request?.status === "pending", "privacy request should start pending");

  const cancelled = await call("/users/privacy-requests/cancel", {
    method: "POST",
    token: state.peer.token,
    body: { requestId: first.data.request.id },
  });
  assert(cancelled.data?.request?.status === "cancelled", "privacy request should cancel");

  const second = await call("/users/privacy-requests", {
    method: "POST",
    token: state.peer.token,
    body: { type: "delete_profile", reason: "Launch smoke admin review" },
  });
  assert(second.data?.request?.status === "pending", "privacy request should be resubmitted");

  const queue = await call("/admin/privacy-requests", { token: state.operator.token });
  assert(
    queue.data?.requests?.some((request) => request.requestId === second.data.request.id),
    "operator queue should include privacy request",
  );

  const rejected = await call("/admin/privacy-requests/review", {
    method: "POST",
    token: state.operator.token,
    body: {
      userId: state.peer.user.id,
      requestId: second.data.request.id,
      status: "reject",
      notes: "Launch smoke rejection",
    },
  });
  assert(rejected.data?.request?.status === "rejected", "operator should reject privacy request");
});

const failed = results.filter((result) => !result.ok);
await fs.writeFile(reportPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  ok: failed.length === 0,
  results,
}, null, 2));

for (const result of results) {
  const prefix = result.ok ? "PASS" : "FAIL";
  console.log(`${prefix} ${result.name}${result.detail ? ` - ${result.detail}` : ""}`);
}

console.log(`Report: ${reportPath}`);

if (failed.length) {
  process.exitCode = 1;
}

async function registerUser(role, overrides = {}) {
  const email = `launch-${role}-${stamp}@qq.com`;
  const payload = await call("/auth/register", {
    method: "POST",
    body: {
      email,
      password: passwordFor(role),
      nickname: overrides.nickname || `Launch ${role}`,
      school: overrides.school || "北京大学",
      major: overrides.major || "测试专业",
      grade: overrides.grade || "大三",
      college: overrides.college || "测试学院",
    },
  });
  assert(payload.data?.token, `${role} should receive token`);
  return { email, token: payload.data.token, user: payload.data.user };
}

async function call(pathname, { method = "GET", token = "", body } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await apiHandler(new Request(`http://launch.local/api${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }), { blobStore });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`${method} ${pathname} ${response.status}: ${payload.message || "request failed"}`);
  }

  return payload;
}

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: error.message || String(error) });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function passwordFor(role) {
  return `Launch${role}123!`;
}
