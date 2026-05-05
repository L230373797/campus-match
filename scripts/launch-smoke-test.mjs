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

await check("change password flow", async () => {
  const newPassword = "LaunchUser456!";
  const changed = await call("/auth/change-password", {
    method: "POST",
    token: state.user.token,
    body: {
      currentPassword: passwordFor("user"),
      newPassword,
    },
  });
  assert(changed.data?.user?.email === state.user.email, "changed password should return current user");

  let oldPasswordRejected = false;
  try {
    await call("/auth/login", {
      method: "POST",
      body: { email: state.user.email, password: passwordFor("user") },
    });
  } catch {
    oldPasswordRejected = true;
  }
  assert(oldPasswordRejected, "old password should stop working");

  const login = await call("/auth/login", {
    method: "POST",
    body: { email: state.user.email, password: newPassword },
  });
  assert(login.data?.token, "new password should log in");
  state.user.token = login.data.token;
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
      mbti: "INFP",
      birthDate: "2004-10-08",
      allowAnonymousMatch: true,
      allowOfflineEvents: true,
    },
  });
  assert(updated.data?.user?.bio === "Launch smoke profile", "profile update should persist");
  assert(updated.data?.user?.mbti === "INFP", "profile MBTI should persist");
  assert(updated.data?.user?.birthDate === "2004-10-08", "profile birth date should persist");
});

await check("self insight and treehole flow", async () => {
  const insight = await call("/users/insights", { token: state.user.token });
  assert(insight.data?.mbti === "INFP", "insights should include MBTI");
  assert(insight.data?.zodiac, "insights should include zodiac");
  assert(Array.isArray(insight.data?.dailyCards), "insights should return daily cards");

  const updatedInsight = await call("/users/insights", {
    method: "POST",
    token: state.user.token,
    body: { moodScore: 84, moodLabel: "想聊天", focus: "找一个轻松开场" },
  });
  assert(updatedInsight.data?.selfInsight?.moodLabel === "想聊天", "mood label should persist");
  assert(Array.isArray(updatedInsight.data?.moodCurve), "mood curve should be returned");

  const savedReport = await call("/users/insights/reports", {
    method: "POST",
    token: state.user.token,
    body: {
      mbti: "INFP",
      birthDate: "2004-10-08",
      report: {
        id: `launch-report-${stamp}`,
        type: "campus-fit",
        title: "学习能量",
        packId: "study-energy",
        packTitle: "学习能量",
        category: "学习",
        version: "2026-05-scale-v1",
        completedAt: new Date().toISOString(),
        answers: { "study-energy-start": "outline", "study-energy-partner": "silent" },
        dimensions: [
          { label: "MBTI", value: "INFP", text: "慢热观察型" },
          { label: "场景入口", value: "图书馆", text: "适合从自习搭子开始" },
        ],
        resultTitle: "学习能量 · 计划型学习",
        resultSummary: "适合从低压力的校园场景开始认识。",
        tags: ["INFP", "慢热", "测一测"],
        sceneTags: ["图书馆", "自习"],
        relationshipGoal: "找学习搭子",
        opener: "看到你也常去图书馆，想问问你最近一般几点自习？",
        recommendedPeople: "能互相监督、但不制造额外压力的学习搭子",
        riskReminder: "学习搭子适合互相提醒，不适合互相审判。",
        deepSections: [
          {
            title: "学习节奏",
            summary: "更适合计划清晰、安静同行的学习关系。",
            items: ["先确认自习时间", "保留各自专注空间", "用轻提醒代替催促"],
          },
        ],
        matchAdvice: {
          suitable: "适合能互相监督、但不制造额外压力的学习搭子。",
          unsuitable: "不太适合频繁打断、临时改计划或把学习变成审判的人。",
        },
        openingLines: [
          "看到你也常去图书馆，想问问你最近一般几点自习？",
          "我也在找安静一点的学习搭子，你更喜欢固定座位还是灵活安排？",
          "如果这周约一次低压力自习，你会更想上午还是晚上？",
        ],
        compareHints: {
          targetName: "Launch Peer",
          shared: ["图书馆", "自习"],
          complement: ["法学", "晨型"],
          opener: "你们都提到图书馆，可以先从常去楼层和自习时间聊起。",
        },
        shareCard: {
          title: "学习能量深度报告",
          resultTitle: "学习能量 · 计划型学习",
          tags: ["INFP", "图书馆", "学习搭子"],
          quote: "看到你也常去图书馆，想问问你最近一般几点自习？",
          text: "学习能量深度报告\n学习能量 · 计划型学习\n关键词：INFP、图书馆、学习搭子\n开场：看到你也常去图书馆，想问问你最近一般几点自习？",
        },
      },
    },
  });
  assert(savedReport.data?.latestReport?.id === `launch-report-${stamp}`, "latest report should be saved");
  assert(savedReport.data?.latestReport?.packId === "study-energy", "latest report should keep pack id");
  assert(savedReport.data?.latestReport?.recommendedPeople, "latest report should keep recommended people");
  assert(savedReport.data?.latestReport?.deepSections?.length >= 1, "latest report should keep deep sections");
  assert(savedReport.data?.latestReport?.openingLines?.length === 3, "latest report should keep opening lines");
  assert(savedReport.data?.latestReport?.shareCard?.text, "latest report should keep share card copy");
  assert(savedReport.data?.testReports?.length >= 1, "test report history should be returned");
  assert(savedReport.data?.recommendedTags?.includes("图书馆"), "recommended tags should include report scene tags");

  const treehole = await call("/users/treeholes", {
    method: "POST",
    token: state.user.token,
    body: { mood: "想被听见", content: "今天想找一个能认真听我说话的人。" },
  });
  assert(treehole.data?.post?.id, "treehole post should be created");
  assert(treehole.data?.posts?.length === 1, "treehole post should be listed");

  const listed = await call("/users/treeholes", { token: state.user.token });
  assert(listed.data?.posts?.[0]?.content.includes("认真听"), "treehole should persist");

  let treeholeBlocked = false;
  try {
    await call("/users/treeholes", {
      method: "POST",
      token: state.user.token,
      body: { mood: "危险内容", content: "约炮开房这种内容不应该出现在校园树洞。" },
    });
  } catch {
    treeholeBlocked = true;
  }
  assert(treeholeBlocked, "severe sensitive treehole should be blocked");
});

await check("test discussion community and moderation flow", async () => {
  const created = await call("/tests/discussions", {
    method: "POST",
    token: state.user.token,
    body: {
      packId: "study-energy",
      packTitle: "学习能量",
      reportId: `launch-report-${stamp}`,
      content: "我测完发现自己更适合图书馆安静搭子，想看看同校有没有类似节奏的人。",
      anonymous: true,
      tags: ["图书馆", "慢热", "学习搭子"],
    },
  });
  const discussionId = created.data?.discussion?.id;
  assert(discussionId, "discussion should be created");
  assert(created.data?.discussion?.anonymous, "discussion should support anonymous posting");
  state.discussionId = discussionId;

  const sameSchool = await call("/tests/discussions?packId=study-energy&scope=same-school&limit=10", {
    token: state.peer.token,
  });
  assert(
    sameSchool.data?.discussions?.some((discussion) => discussion.id === discussionId),
    "same-school discussion list should include new post",
  );

  const replied = await call(`/tests/discussions/${discussionId}/replies`, {
    method: "POST",
    token: state.peer.token,
    body: {
      content: "我也是安静型学习搭子，更喜欢先约固定时段。",
      anonymous: false,
    },
  });
  assert(replied.data?.discussion?.replyCount >= 1, "reply should be saved on discussion");

  const reacted = await call(`/tests/discussions/${discussionId}/reactions`, {
    method: "POST",
    token: state.peer.token,
    body: { type: "resonate" },
  });
  assert(reacted.data?.discussion?.reactionCounts?.resonate >= 1, "resonate reaction should be counted");

  let blocked = false;
  try {
    await call("/tests/discussions", {
      method: "POST",
      token: state.user.token,
      body: {
        packId: "study-energy",
        content: "约炮开房这种内容不应该出现在校园社区。",
      },
    });
  } catch {
    blocked = true;
  }
  assert(blocked, "severe sensitive discussion should be blocked");

  await call(`/tests/discussions/${discussionId}/reports`, {
    method: "POST",
    token: state.peer.token,
    body: { reason: "Launch smoke report 1" },
  });
  await call(`/tests/discussions/${discussionId}/reports`, {
    method: "POST",
    token: state.operator.token,
    body: { reason: "Launch smoke report 2" },
  });
  await call(`/tests/discussions/${discussionId}/reports`, {
    method: "POST",
    token: state.user.token,
    body: { reason: "Launch smoke report 3" },
  });

  const hiddenList = await call("/tests/discussions?packId=study-energy&scope=same-school&limit=10", {
    token: state.peer.token,
  });
  assert(
    !hiddenList.data?.discussions?.some((discussion) => discussion.id === discussionId),
    "three reports should hide discussion from public list",
  );

  const adminQueue = await call("/admin/discussions?status=queue", { token: state.operator.token });
  const queued = adminQueue.data?.discussions?.find((discussion) => discussion.id === discussionId);
  assert(queued?.hidden && queued.reportCount >= 3, "admin discussion queue should include auto-hidden reported post");

  const restored = await call(`/admin/discussions/${discussionId}/moderate`, {
    method: "POST",
    token: state.operator.token,
    body: { action: "restore", notes: "Launch smoke restored discussion" },
  });
  assert(restored.data?.discussion?.hidden === false, "operator should restore discussion");

  const restoredList = await call("/tests/discussions?packId=study-energy&scope=same-school&limit=10", {
    token: state.peer.token,
  });
  assert(
    restoredList.data?.discussions?.some((discussion) => discussion.id === discussionId),
    "restored discussion should return to public list",
  );
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

await check("profile photo upload and removal", async () => {
  const uploaded = await call("/uploads/profile-photo", {
    method: "POST",
    token: state.user.token,
    body: {
      contentType: "image/png",
      data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    },
  });
  assert(uploaded.data?.imageUrl?.startsWith("/api/uploads/profile-photos/"), "profile photo upload should return image URL");
  assert(uploaded.data?.user?.photos?.includes(uploaded.data.imageUrl), "profile photo should be written to returned user");

  const imageResponse = await apiHandler(new Request(`http://launch.local${uploaded.data.imageUrl}`), { blobStore });
  assert(imageResponse.ok, "profile photo image should be readable");

  const removed = await call("/uploads/profile-photo", {
    method: "DELETE",
    token: state.user.token,
    body: { imageUrl: uploaded.data.imageUrl },
  });
  assert(!removed.data?.user?.photos?.includes(uploaded.data.imageUrl), "profile photo should be removed from user");
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
  state.firstMessageId = sent.data.message.id;

  const messages = await call(`/messages/${state.matchId}`, { token: state.peer.token });
  assert(messages.data?.messages?.some((message) => message.content === "Launch smoke hello"), "message list should include sent message");

  const imageUpload = await call("/uploads/chat-image", {
    method: "POST",
    token: state.peer.token,
    body: {
      contentType: "image/png",
      data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGOSHzRgAAAAABJRU5ErkJggg==",
    },
  });
  assert(imageUpload.data?.imageUrl?.startsWith("/api/uploads/chat-images/"), "chat image upload should return an image URL");

  const imageMessage = await call(`/messages/${state.matchId}`, {
    method: "POST",
    token: state.peer.token,
    body: { type: "image", content: imageUpload.data.imageUrl },
  });
  assert(imageMessage.data?.message?.type === "image", "image message should be saved with image type");

  const typingOn = await call(`/messages/${state.matchId}/typing`, {
    method: "POST",
    token: state.peer.token,
    body: { active: true },
  });
  assert(typingOn.data?.typing?.activeUsers?.length === 0, "sender should not see their own typing state");

  const typingSeen = await call(`/messages/${state.matchId}/typing`, { token: state.user.token });
  assert(
    typingSeen.data?.typing?.activeUsers?.some((entry) => entry.userId === state.peer.user.id),
    "other user should see active typing state",
  );

  const typingOff = await call(`/messages/${state.matchId}/typing`, {
    method: "POST",
    token: state.peer.token,
    body: { active: false },
  });
  assert(typingOff.data?.typing?.activeUsers?.length === 0, "typing state should clear");

  const hidden = await call(`/messages/${state.matchId}/${state.firstMessageId}`, {
    method: "DELETE",
    token: state.peer.token,
  });
  assert(
    !hidden.data?.messages?.some((message) => message.id === state.firstMessageId),
    "deleted message should be hidden for current user",
  );

  const stillVisible = await call(`/messages/${state.matchId}`, { token: state.user.token });
  assert(
    stillVisible.data?.messages?.some((message) => message.id === state.firstMessageId),
    "locally deleted message should stay visible to the other user",
  );

  const reported = await call(`/messages/${state.matchId}/${state.firstMessageId}/reports`, {
    method: "POST",
    token: state.user.token,
    body: { reason: "Launch smoke message report" },
  });
  assert(reported.data?.reportCount === 1, "message report should be counted");
  assert(
    !reported.data?.messages?.some((message) => message.id === state.firstMessageId),
    "reported message should be hidden for reporter",
  );

  const recalled = await call(`/messages/${state.matchId}/${imageMessage.data.message.id}?scope=all`, {
    method: "DELETE",
    token: state.peer.token,
  });
  assert(recalled.data?.message?.recalledAt, "own message should be recallable");

  const recalledList = await call(`/messages/${state.matchId}`, { token: state.user.token });
  assert(
    recalledList.data?.messages?.some((message) => message.id === imageMessage.data.message.id && message.recalledAt),
    "recalled message should be marked for the other user",
  );

  const reveal = await call(`/matches/${state.matchId}/reveal`, {
    method: "POST",
    token: state.peer.token,
  });
  assert(typeof reveal.data?.bothRevealed === "boolean", "reveal request should return state");
});

await check("admin user and match data are unified", async () => {
  const overview = await call("/admin/overview", { token: state.operator.token });
  assert(overview.data?.counts?.matches >= 1, "admin overview should count matches");
  assert(Number.isFinite(overview.data?.counts?.unreadMessages), "admin overview should expose unread message count");
  assert(overview.data?.counts?.testReports >= 1, "admin overview should count saved test reports");
  assert(overview.data?.counts?.reportedMessages >= 1, "admin overview should count reported messages");

  const users = await call("/admin/users", { token: state.operator.token });
  const launchUser = users.data?.users?.find((user) => user.id === state.user.user.id);
  assert(launchUser?.mbti === "INFP", "admin users should expose user-facing profile fields");
  assert(Number.isFinite(launchUser?.readiness?.score), "admin users should expose profile readiness");

  const matches = await call("/admin/matches", { token: state.operator.token });
  const match = matches.data?.matches?.find((item) => item.id === state.matchId);
  assert(match?.participants?.length === 2, "admin matches should include both participant summaries");
  assert(match.messageCount >= 1, "admin matches should include message counts");
});

await check("admin account management", async () => {
  const accounts = await call("/admin/accounts", { token: state.operator.token });
  assert(
    accounts.data?.accounts?.some((account) => account.email === state.operator.email && account.isAdmin),
    "admin account list should include current operator",
  );

  const adminEmail = `launch-admin-${stamp}@qq.com`;
  const created = await call("/admin/accounts", {
    method: "POST",
    token: state.operator.token,
    body: {
      email: adminEmail,
      nickname: "Launch Backup Admin",
      password: "LaunchAdmin123!",
    },
  });
  assert(created.data?.account?.isAdmin, "created account should be admin");

  const reset = await call("/admin/accounts/reset-password", {
    method: "POST",
    token: state.operator.token,
    body: {
      userId: created.data.account.id,
      newPassword: "LaunchAdmin456!",
    },
  });
  assert(reset.data?.account?.id === created.data.account.id, "reset should return target admin");

  const login = await call("/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: "LaunchAdmin456!" },
  });
  assert(login.data?.user?.isAdmin, "reset password should log in admin");
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
