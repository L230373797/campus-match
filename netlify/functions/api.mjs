import { getDeployStore, getStore } from "@netlify/blobs";
import { neon } from "@netlify/neon";
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { createDataStore } from "./_shared/mysql-store.mjs";

const STORE_NAME = "campus-match-data";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const EMAIL_CODE_TTL_MS = 1000 * 60 * 10;
const EMAIL_CODE_RESEND_MS = 1000 * 60;
const MEMBERSHIP_PLAN_LIBRARY = {
  free: {
    id: "free",
    name: "免费用户",
    description: "先用基础功能体验真实校园连接。",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "每日 12 条推荐",
      "基础同校匹配",
      "校园认证与资料完善",
    ],
    limits: {
      recommendationWindow: 12,
      advancedFilters: false,
      spotlight: false,
    },
  },
  plus: {
    id: "plus",
    name: "校园会员",
    description: "适合开始认真使用校园匹配的活跃用户。",
    monthlyPrice: 19,
    yearlyPrice: 168,
    features: [
      "每日 30 条推荐",
      "更高资料曝光",
      "高级筛选",
      "优先出现在同校推荐里",
    ],
    limits: {
      recommendationWindow: 30,
      advancedFilters: true,
      spotlight: false,
    },
  },
  premium: {
    id: "premium",
    name: "高级会员",
    description: "适合希望获得最高曝光和更快撮合反馈的用户。",
    monthlyPrice: 39,
    yearlyPrice: 328,
    features: [
      "推荐浏览近乎无限",
      "超级曝光位",
      "高级筛选",
      "认证审核优先",
      "专属会员身份标识",
    ],
    limits: {
      recommendationWindow: 99,
      advancedFilters: true,
      spotlight: true,
    },
  },
};
const MEMBERSHIP_PLAN_ORDER = ["free", "plus", "premium"];
let sqlClient;
let dbReady = false;

export default async (req, context) => {
  const store = await getDataStore(context);

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api/, "") || "/";
    const segments = path.split("/").filter(Boolean);

    if (req.method === "GET" && path === "/health") {
      return json({ success: true, data: { status: "ok" } });
    }

    if (segments[0] === "auth") {
      return await handleAuth(req, store, segments);
    }

    if (segments[0] === "admin") {
      return await handleAdmin(req, store, segments);
    }

    if (segments[0] === "membership") {
      return await handleMembership(req, store, segments);
    }

    if (segments[0] === "users") {
      return await handleUsers(req, store, segments, url);
    }

    if (segments[0] === "uploads") {
      return await handleUploads(req, store, segments);
    }

    if (segments[0] === "matches") {
      return await handleMatches(req, store, segments);
    }

    if (segments[0] === "messages") {
      return await handleMessages(req, store, segments, url);
    }

    return json({ success: false, message: "接口不存在" }, 404);
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 500;
    const message = status === 500 ? "服务器暂时不可用" : error.message;
    if (status === 500) {
      console.error(error);
    }
    return json({ success: false, message }, status);
  }
};

export const config = {
  path: "/api/*",
};

async function getDataStore(context) {
  const blobStore = context?.blobStore || (
    context?.deploy?.context === "production"
      ? getStore(STORE_NAME, { consistency: "strong" })
      : getDeployStore(STORE_NAME)
  );

  return createDataStore({ blobStore, env: getEnv });
}

async function handleAuth(req, store, segments) {
  if (segments[1] === "send-code" && req.method === "POST") {
    const body = await readBody(req);
    const email = normalizeEmail(body.email);

    if (!isAllowedRegistrationEmail(email)) {
      throw httpError("请使用 QQ 邮箱注册，例如 123456@qq.com", 400);
    }

    const existingUser = await findUserByEmail(store, email);
    if (existingUser) {
      throw httpError("这个邮箱已经注册过了", 409);
    }

    const verification = await createEmailVerification(store, email);
    await sendVerificationEmail(email, verification.code);

    const debugCode = getEnv("EMAIL_VERIFICATION_DEBUG") === "true" ? verification.code : undefined;
    return json({
      success: true,
      message: "验证码已发送，请查收 QQ 邮箱",
      data: { expiresIn: EMAIL_CODE_TTL_MS / 1000, debugCode },
    });
  }

  if (segments[1] === "register" && req.method === "POST") {
    const body = await readBody(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const emailCode = text(body.emailCode || body.code);

    if (!email || !password) {
      throw httpError("请填写邮箱和密码", 400);
    }

    if (!isAllowedRegistrationEmail(email)) {
      throw httpError("请使用 QQ 邮箱注册，例如 123456@qq.com", 400);
    }

    if (password.length < 6) {
      throw httpError("密码至少需要 6 位", 400);
    }

    const existingUser = await findUserByEmail(store, email);
    if (existingUser) {
      throw httpError("这个邮箱已经注册过了", 409);
    }

    if (isEmailVerificationActive()) {
      await verifyEmailCode(store, email, emailCode);
    }

    const now = new Date().toISOString();
    const passwordRecord = hashPassword(password);
    const school = text(body.school) || "未设置学校";
    const user = {
      id: makeId("user"),
      email,
      studentId: text(body.studentId),
      nickname: text(body.nickname) || email.split("@")[0],
      school,
      grade: text(body.grade),
      major: text(body.major),
      college: text(body.college),
      campusZone: text(body.campusZone),
      dormArea: text(body.dormArea),
      bio: text(body.bio) || "刚加入校园匹配，期待遇见同校同频的人。",
      tags: arrayOfText(body.tags),
      sceneTags: arrayOfText(body.sceneTags),
      matchModes: arrayOfText(body.matchModes),
      schedule: text(body.schedule),
      idealScene: text(body.idealScene),
      relationshipGoal: text(body.relationshipGoal) || "先低压力认识彼此",
      allowAnonymousMatch: body.allowAnonymousMatch !== false,
      allowOfflineEvents: body.allowOfflineEvents !== false,
      campusCardImage: text(body.campusCardImage),
      avatar: text(body.avatar),
      isVerified: false,
      verificationStatus: body.campusCardImage ? "pending" : "unverified",
      verificationBadge: body.campusCardImage ? `${school} 认证审核中` : "",
      verificationRequestedAt: body.campusCardImage ? now : null,
      verificationNotes: "",
      membership: createDefaultMembership(now),
      stats: { matches: 0, likes: 0, views: 0 },
      skippedIds: [],
      createdAt: now,
      updatedAt: now,
      ...passwordRecord,
    };

    await saveUser(store, user);
    const token = await createSession(store, user.id);
    return json({ success: true, message: "注册成功", data: { token, user: publicUser(user) } }, 201);
  }

  if (segments[1] === "login" && req.method === "POST") {
    const body = await readBody(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const user = await findUserByEmail(store, email);

    if (!user || !verifyPassword(password, user)) {
      throw httpError("邮箱或密码不正确", 401);
    }

    assertAccountCanLogin(user);

    const token = await createSession(store, user.id);
    return json({ success: true, message: "登录成功", data: { token, user: publicUser(user) } });
  }

  if (segments[1] === "me" && req.method === "GET") {
    const user = await requireUser(req, store);
    return json({ success: true, data: { user: publicUser(user) } });
  }

  return json({ success: false, message: "接口不存在" }, 404);
}

async function handleAdmin(req, store, segments) {
  const user = await requireUser(req, store);
  requireAdmin(user);

  if (segments[1] === "privacy-requests" && req.method === "GET") {
    const users = await listUsers(store);
    const requests = users
      .flatMap((item) => normalizePrivacyRequests(item).map((request) => adminPrivacyRequest(item, request)))
      .sort((a, b) => String(b.requestedAt || "").localeCompare(String(a.requestedAt || "")));

    return json({ success: true, data: { requests } });
  }

  if (segments[1] === "privacy-requests" && segments[2] === "review" && req.method === "POST") {
    const body = await readBody(req);
    const targetUser = await getUser(store, text(body.userId));
    if (!targetUser) {
      throw httpError("User not found", 404);
    }

    const result = await reviewPrivacyRequest(store, targetUser, {
      requestId: text(body.requestId),
      status: text(body.status || body.action).toLowerCase(),
      notes: text(body.notes),
      reviewer: user,
    });

    return json({
      success: true,
      message: result.message,
      data: { request: adminPrivacyRequest(result.user, result.request) },
    });
  }

  if (segments[1] === "export" && req.method === "GET") {
    const [users, matches, messages] = await Promise.all([
      listUsers(store),
      listMatches(store),
      listAllMessages(store),
    ]);

    return json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        counts: {
          users: users.length,
          matches: matches.length,
          messages: messages.length,
        },
        users: users.map(adminExportUser),
        matches,
        messages,
      },
    });
  }

  return json({ success: false, message: "接口不存在" }, 404);
}

async function handleMembership(req, store, segments) {
  const user = await requireUser(req, store);

  if (segments.length === 1 && req.method === "GET") {
    return json({
      success: true,
      data: buildMembershipPayload(user),
    });
  }

  if (segments[1] === "subscribe" && req.method === "POST") {
    const body = await readBody(req);
    const planId = text(body.planId || body.type).toLowerCase();
    const billingCycle = text(body.billingCycle).toLowerCase() === "yearly" ? "yearly" : "monthly";

    if (!MEMBERSHIP_PLAN_LIBRARY[planId]) {
      throw httpError("会员方案不存在", 400);
    }

    const updatedUser = {
      ...user,
      membership: activateMembershipPlan(user.membership, planId, billingCycle),
      updatedAt: new Date().toISOString(),
    };
    await saveUser(store, updatedUser);

    return json({
      success: true,
      message: planId === "free" ? "已切换为免费用户" : `已开通${updatedUser.membership.title}`,
      data: {
        ...buildMembershipPayload(updatedUser),
        user: publicUser(updatedUser),
      },
    });
  }

  return json({ success: false, message: "接口不存在" }, 404);
}

async function handleUsers(req, store, segments, url) {
  const user = await requireUser(req, store);

  if (segments[1] === "profile" && req.method === "GET") {
    return json({ success: true, data: { user: publicUser(user) } });
  }

  if (segments[1] === "profile" && req.method === "PUT") {
    const body = await readBody(req);
    const allowedFields = [
      "nickname",
      "bio",
      "tags",
      "sceneTags",
      "grade",
      "major",
      "college",
      "campusCardImage",
      "dormArea",
      "campusZone",
      "schedule",
      "idealScene",
      "relationshipGoal",
      "matchModes",
      "allowAnonymousMatch",
      "allowOfflineEvents",
      "avatar",
    ];

    const updatedUser = { ...user };
    for (const field of allowedFields) {
      if (Object.hasOwn(body, field)) {
        updatedUser[field] = Array.isArray(body[field]) ? arrayOfText(body[field]) : body[field];
      }
    }

    updatedUser.updatedAt = new Date().toISOString();
    await saveUser(store, updatedUser);
    return json({ success: true, message: "资料更新成功", data: { user: publicUser(updatedUser) } });
  }

  if (segments[1] === "privacy-requests" && req.method === "GET") {
    return json({
      success: true,
      data: { requests: normalizePrivacyRequests(user) },
    });
  }

  if (segments[1] === "privacy-requests" && segments[2] === "cancel" && req.method === "POST") {
    const body = await readBody(req);
    const requestId = text(body.requestId);
    if (!requestId) {
      throw httpError("Choose a request to cancel", 400);
    }

    const requests = normalizePrivacyRequests(user);
    const index = requests.findIndex((request) => request.id === requestId);
    if (index < 0) {
      throw httpError("Request not found", 404);
    }

    if (requests[index].status !== "pending") {
      throw httpError("Only pending requests can be cancelled", 400);
    }

    const now = new Date().toISOString();
    const cancelledRequest = normalizePrivacyRequest({
      ...requests[index],
      status: "cancelled",
      statusLabel: privacyRequestStatusLabel("cancelled"),
      cancelledAt: now,
    });
    const nextRequests = [...requests];
    nextRequests[index] = cancelledRequest;
    const updatedUser = {
      ...user,
      privacyRequests: nextRequests,
      privacyRequestStatus: nextRequests.some((request) => request.status === "pending") ? "pending" : "none",
      updatedAt: now,
    };
    await saveUser(store, updatedUser);

    return json({
      success: true,
      message: "Privacy request cancelled",
      data: { request: cancelledRequest, requests: normalizePrivacyRequests(updatedUser) },
    });
  }

  if (segments[1] === "privacy-requests" && req.method === "POST") {
    const body = await readBody(req);
    const type = normalizePrivacyRequestType(body.type);
    if (!type) {
      throw httpError("Choose a request type", 400);
    }

    const requests = normalizePrivacyRequests(user);
    const pendingRequest = requests.find((request) => request.status === "pending");
    if (pendingRequest) {
      return json({
        success: true,
        message: "You already have a pending privacy request",
        data: { request: pendingRequest, requests },
      });
    }

    const now = new Date().toISOString();
    const request = normalizePrivacyRequest({
      id: makeId("privacy"),
      type,
      reason: text(body.reason).slice(0, 500),
      status: "pending",
      requestedAt: now,
    });
    const updatedUser = {
      ...user,
      privacyRequests: [request, ...requests],
      privacyRequestStatus: "pending",
      updatedAt: now,
    };
    await saveUser(store, updatedUser);

    return json({
      success: true,
      message: "Privacy request submitted",
      data: { request, requests: normalizePrivacyRequests(updatedUser) },
    }, 201);
  }

  if (segments[1] === "verification" && segments[2] === "request" && req.method === "POST") {
    if (!user.campusCardImage) {
      throw httpError("请先填写校园卡图片地址，再提交认证申请", 400);
    }

    const updatedUser = {
      ...user,
      verificationStatus: "pending",
      verificationBadge: `${user.school || "校园"} 认证审核中`,
      verificationRequestedAt: new Date().toISOString(),
      verificationNotes: "",
      updatedAt: new Date().toISOString(),
    };
    await saveUser(store, updatedUser);
    return json({ success: true, message: "认证申请已提交", data: { user: publicUser(updatedUser) } });
  }

  if (segments[1] === "verification" && segments[2] === "pending" && req.method === "GET") {
    requireAdmin(user);

    const users = await listUsers(store);
    const pendingUsers = users
      .filter((item) => item.verificationStatus === "pending")
      .sort((a, b) => String(b.verificationRequestedAt || "").localeCompare(String(a.verificationRequestedAt || "")))
      .map(publicUser);

    return json({ success: true, data: { users: pendingUsers } });
  }

  if (segments[1] === "verification" && segments[2] === "review" && req.method === "POST") {
    requireAdmin(user);

    const body = await readBody(req);
    const targetUser = await getUser(store, text(body.userId));
    if (!targetUser) {
      throw httpError("用户不存在", 404);
    }

    const approved = body.action === "approve";
    const updatedUser = {
      ...targetUser,
      isVerified: approved,
      verificationStatus: approved ? "approved" : "rejected",
      verificationBadge: approved ? `${targetUser.school || "校园"} 认证` : "",
      verificationNotes: text(body.notes),
      verificationReviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveUser(store, updatedUser);

    return json({
      success: true,
      message: approved ? "认证已通过" : "认证已驳回",
      data: { user: publicUser(updatedUser) },
    });
  }

  if (segments[1] === "recommendations" && req.method === "GET") {
    const membership = normalizeMembershipRecord(user.membership, user.createdAt);
    const recommendationWindow = membership.limits?.recommendationWindow || 12;
    const limit = clampNumber(
      url.searchParams.get("limit"),
      1,
      recommendationWindow,
      Math.min(10, recommendationWindow),
    );
    const page = clampNumber(url.searchParams.get("page"), 1, 999, 1);
    const skipped = new Set(user.skippedIds || []);
    const allUsers = (await listUsers(store))
      .filter(isActiveUser)
      .map(publicUser)
      .filter((item) => item.id !== user.id && !skipped.has(item.id));
    const recommendations = allUsers.length
      ? allUsers
      : filterSeedProfiles({ viewer: user, query: "", school: "", major: "", grade: "" })
          .filter((item) => !skipped.has(item.id));
    const start = (page - 1) * limit;

    return json({
      success: true,
      data: {
        users: recommendations.slice(start, start + limit),
        pagination: { page, limit, total: recommendations.length },
      },
    });
  }

  if (segments[1] === "search" && req.method === "GET") {
    const result = await searchUsers(store, user, url);
    return json({ success: true, data: result });
  }

  return json({ success: false, message: "接口不存在" }, 404);
}

async function handleUploads(req, store, segments) {
  if (req.method === "GET" && segments.length >= 2) {
    const key = segments.slice(1).join("/");
    if (!key.startsWith("campus-cards/")) {
      throw httpError("文件不存在", 404);
    }

    const image = await store.get(`uploads/${key}`, { type: "arrayBuffer" });
    if (!image) {
      throw httpError("文件不存在", 404);
    }

    return new Response(image, {
      headers: {
        "Cache-Control": "private, max-age=300",
        "Content-Type": contentTypeFromKey(key),
      },
    });
  }

  if (segments[1] === "campus-card" && req.method === "POST") {
    const user = await requireUser(req, store);
    const body = await readBody(req);
    const contentType = text(body.contentType).toLowerCase();
    const data = text(body.data);

    if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
      throw httpError("只支持 JPG、PNG 或 WebP 图片", 400);
    }

    const base64 = data.includes(",") ? data.split(",").pop() : data;
    const buffer = Buffer.from(base64, "base64");
    if (!buffer.length) {
      throw httpError("图片内容为空", 400);
    }

    if (buffer.length > 3 * 1024 * 1024) {
      throw httpError("图片不能超过 3MB", 400);
    }

    const extension = extensionFromContentType(contentType);
    const fileId = makeId("card");
    const key = `uploads/campus-cards/${user.id}/${fileId}.${extension}`;
    await store.set(key, buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));

    const campusCardImage = `/api/uploads/campus-cards/${user.id}/${fileId}.${extension}`;
    const updatedUser = {
      ...user,
      campusCardImage,
      verificationStatus: "pending",
      verificationBadge: `${user.school || "校园"} 认证审核中`,
      verificationRequestedAt: new Date().toISOString(),
      verificationNotes: "",
      updatedAt: new Date().toISOString(),
    };
    await saveUser(store, updatedUser);

    return json({
      success: true,
      message: "校园卡已上传，认证申请已提交",
      data: { imageUrl: campusCardImage, user: publicUser(updatedUser) },
    }, 201);
  }

  return json({ success: false, message: "接口不存在" }, 404);
}

async function handleMatches(req, store, segments) {
  const user = await requireUser(req, store);

  if (segments.length === 1 && req.method === "GET") {
    const matches = await listMatchesForUser(store, user.id);
    const unreadTotal = matches.reduce((total, match) => total + (match.unreadCount || 0), 0);
    return json({ success: true, data: { matches, unreadTotal } });
  }

  if (segments[1] === "like" && segments[2] && req.method === "POST") {
    const target = await findPublicProfile(store, segments[2]);
    if (!target) {
      throw httpError("用户不存在", 404);
    }

    if ((target.id || target._id) === user.id) {
      throw httpError("不能匹配自己的账号", 400);
    }

    const { match, isNewMatch } = await upsertMatch(store, user, target);
    return json({
      success: true,
      data: {
        isNewMatch,
        message: isNewMatch ? "匹配成功！" : "你们已经匹配过了",
        match,
      },
    });
  }

  if (segments[1] === "skip" && segments[2] && req.method === "POST") {
    const skippedIds = new Set(user.skippedIds || []);
    skippedIds.add(segments[2]);
    await saveUser(store, { ...user, skippedIds: [...skippedIds], updatedAt: new Date().toISOString() });
    return json({ success: true, message: "已跳过" });
  }

  if (segments[1] && segments[2] === "read" && req.method === "POST") {
    const match = await getMatch(store, segments[1]);
    if (!match || !match.participants.includes(user.id)) {
      throw httpError("匹配不存在", 404);
    }

    const updatedMatch = markMatchRead(match, user.id);
    await saveMatch(store, updatedMatch);
    return json({
      success: true,
      data: { match: serializeMatch(updatedMatch, user.id, await findOtherProfile(store, updatedMatch, user.id), []) },
    });
  }

  if (segments[1] && segments[2] === "reveal" && req.method === "POST") {
    const match = await getMatch(store, segments[1]);
    if (!match || !match.participants.includes(user.id)) {
      throw httpError("匹配不存在", 404);
    }

    const requests = new Set(match.revealRequests || []);
    requests.add(user.id);
    const bothRevealed = match.participants.every((participant) => requests.has(participant));
    const updatedMatch = {
      ...match,
      identityRevealed: bothRevealed,
      revealRequests: [...requests],
      updatedAt: new Date().toISOString(),
    };
    await saveMatch(store, updatedMatch);

    return json({
      success: true,
      data: {
        bothRevealed,
        message: bothRevealed ? "双方已确认，可以互相查看真实身份" : "申请已发送，等待对方确认",
      },
    });
  }

  return json({ success: false, message: "接口不存在" }, 404);
}

async function handleMessages(req, store, segments, url) {
  const user = await requireUser(req, store);
  const matchId = segments[1];

  if (!matchId) {
    return json({ success: false, message: "接口不存在" }, 404);
  }

  const match = await getMatch(store, matchId);
  if (!match || !match.participants.includes(user.id)) {
    throw httpError("匹配不存在", 404);
  }

  if (req.method === "GET") {
    const page = clampNumber(url.searchParams.get("page"), 1, 999, 1);
    const limit = clampNumber(url.searchParams.get("limit"), 1, 100, 20);
    const messages = await getMessages(store, matchId);
    const start = Math.max(messages.length - page * limit, 0);
    const end = messages.length - (page - 1) * limit;
    const updatedMatch = markMatchRead(match, user.id);
    await saveMatch(store, updatedMatch);

    return json({
      success: true,
      data: {
        messages: messages.slice(start, end),
        pagination: { page, limit, total: messages.length },
      },
    });
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    const content = text(body.content);
    if (!content) {
      throw httpError("消息内容不能为空", 400);
    }

    const now = new Date().toISOString();
    const messageId = makeId("msg");
    const message = {
      _id: messageId,
      id: messageId,
      match: matchId,
      senderId: user.id,
      sender: publicUser(user),
      content,
      type: text(body.type) || "text",
      createdAt: now,
    };
    const messages = await getMessages(store, matchId);
    messages.push(message);
    await store.setJSON(`messages/${matchId}`, messages);
    await saveMatch(store, applyOutgoingMessageState(match, user.id, content, now));

    return json({ success: true, data: { message } }, 201);
  }

  if (req.method === "DELETE") {
    await store.delete(`messages/${matchId}`);
    await saveMatch(store, {
      ...markMatchRead(match, user.id),
      lastMessagePreview: "",
      lastMessageSenderId: "",
      updatedAt: new Date().toISOString(),
    });
    return json({ success: true, message: "聊天记录已清空" });
  }

  return json({ success: false, message: "接口不存在" }, 404);
}

async function upsertMatch(store, user, target) {
  const targetId = target.id || target._id;
  const pairKey = [user.id, targetId].sort().join("__");
  const existing = await store.get(`match-pairs/${pairKey}`, { type: "json" });
  if (existing?.matchId) {
    const match = await getMatch(store, existing.matchId);
    if (match) {
      return {
        isNewMatch: false,
        match: serializeMatch(match, user.id, target),
      };
    }
  }

  const now = new Date().toISOString();
  const match = {
    id: makeId("match"),
    participants: [user.id, targetId],
    userSnapshots: {
      [user.id]: publicUser(user),
      [targetId]: target,
    },
    matchedAt: now,
    lastMessageAt: now,
    identityRevealed: false,
    revealRequests: [],
    readAtByUser: {
      [user.id]: now,
      [targetId]: now,
    },
    unreadByUser: {
      [user.id]: 0,
      [targetId]: 0,
    },
    lastMessagePreview: "",
    lastMessageSenderId: "",
    createdAt: now,
    updatedAt: now,
  };

  await saveMatch(store, match);
  await store.setJSON(`match-pairs/${pairKey}`, { matchId: match.id });
  await saveUser(store, bumpStat(user, "matches"));
  const targetRecord = await getUser(store, targetId);
  if (targetRecord) {
    await saveUser(store, bumpStat(targetRecord, "likes"));
  }
  return {
    isNewMatch: true,
    match: serializeMatch(match, user.id, target),
  };
}

async function listMatchesForUser(store, userId) {
  const matches = [];

  for (const match of await listMatches(store)) {
    if (match?.participants?.includes(userId)) {
      const otherProfile = await findOtherProfile(store, match, userId);
      const messages = await getMessages(store, match.id);
      matches.push(serializeMatch(match, userId, otherProfile, messages));
    }
  }

  return matches.sort((a, b) => String(b.lastMessageAt || "").localeCompare(String(a.lastMessageAt || "")));
}

async function findOtherProfile(store, match, userId) {
  const otherId = match.participants.find((participant) => participant !== userId);
  return findPublicProfile(store, otherId, match.userSnapshots?.[otherId]);
}

async function findPublicProfile(store, id, fallback = null) {
  const user = await getUser(store, id);
  if (user && isActiveUser(user)) {
    return publicUser(user);
  }

  return seedProfiles().find((item) => item.id === id || item._id === id) || fallback;
}

async function getUser(store, userId) {
  if (!userId) {
    return null;
  }

  return normalizeUserRecord(await store.get(`users/${userId}`, { type: "json" }));
}

async function saveUser(store, user) {
  const normalizedUser = {
    ...user,
    membership: normalizeMembershipRecord(user.membership, user.createdAt),
    stats: normalizeUserStats(user.stats),
    tags: arrayOfText(user.tags),
    sceneTags: arrayOfText(user.sceneTags),
    matchModes: arrayOfText(user.matchModes),
    skippedIds: Array.isArray(user.skippedIds) ? user.skippedIds.map(text).filter(Boolean) : [],
    privacyRequests: normalizePrivacyRequests(user),
    privacyRequestStatus: text(user.privacyRequestStatus) || "none",
    accountStatus: text(user.accountStatus) || "active",
    isAdmin: hasAdminAccess(user),
  };
  await store.setJSON(`users/${normalizedUser.id}`, normalizedUser);
  await store.setJSON(`email/${encodeURIComponent(normalizedUser.email)}`, { userId: normalizedUser.id });
  await indexUserInDatabase(normalizedUser);
}

async function listUsers(store) {
  return (await listJsonRecords(store, "users/")).map(normalizeUserRecord).filter(Boolean);
}

async function listMatches(store) {
  return listJsonRecords(store, "matches/");
}

async function listAllMessages(store) {
  const threads = await listJsonRecordEntries(store, "messages/");
  return threads.flatMap(({ key, value }) => {
    const matchId = key.replace(/^messages\//, "");
    return (Array.isArray(value) ? value : []).map((message) => ({
      ...message,
      matchId: message.matchId || matchId,
    }));
  });
}

async function listJsonRecords(store, prefix) {
  const records = await listJsonRecordEntries(store, prefix);
  return records.map((record) => record.value);
}

async function listJsonRecordEntries(store, prefix) {
  const records = [];
  let cursor;

  do {
    const page = await store.list({ prefix, cursor });
    for (const blob of page.blobs || []) {
      const value = await store.get(blob.key, { type: "json" });
      if (value) {
        records.push({ key: blob.key, value });
      }
    }
    cursor = page.cursor;
  } while (cursor);

  return records;
}

async function findUserByEmail(store, email) {
  if (!email) {
    return null;
  }

  const record = await store.get(`email/${encodeURIComponent(email)}`, { type: "json" });
  if (!record?.userId) {
    return null;
  }

  return getUser(store, record.userId);
}

async function createSession(store, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  await store.setJSON(`sessions/${token}`, {
    token,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    createdAt: new Date().toISOString(),
  });
  return token;
}

async function requireUser(req, store) {
  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    throw httpError("请先登录", 401);
  }

  const session = await store.get(`sessions/${token}`, { type: "json" });
  if (!session?.userId || Date.parse(session.expiresAt) < Date.now()) {
    throw httpError("登录已过期，请重新登录", 401);
  }

  const user = await getUser(store, session.userId);
  if (!user) {
    throw httpError("用户不存在", 401);
  }

  assertAccountCanLogin(user);

  return user;
}

async function getMatch(store, matchId) {
  return store.get(`matches/${matchId}`, { type: "json" });
}

async function saveMatch(store, match) {
  await store.setJSON(`matches/${match.id}`, match);
}

async function getMessages(store, matchId) {
  return (await store.get(`messages/${matchId}`, { type: "json" })) || [];
}

function serializeMatch(match, viewerId, otherProfile, messages = []) {
  const lastMessage = [...messages].reverse().find(Boolean);
  const unreadCount = calculateUnreadCount(match, viewerId, messages);
  const lastMessageAt = match.lastMessageAt || lastMessage?.createdAt || match.matchedAt;
  const lastMessagePreview = text(match.lastMessagePreview) || text(lastMessage?.content);
  const lastMessageSenderId = text(match.lastMessageSenderId) || senderIdForMessage(lastMessage || {});
  return {
    id: match.id,
    _id: match.id,
    matchedAt: match.matchedAt,
    identityRevealed: Boolean(match.identityRevealed),
    lastMessageAt,
    lastMessagePreview,
    lastMessageSenderId,
    unreadCount,
    hasUnread: unreadCount > 0,
    readAt: match.readAtByUser?.[viewerId] || null,
    user: otherProfile || null,
  };
}

function calculateUnreadCount(match, viewerId, messages = []) {
  const storedCount = Number(match.unreadByUser?.[viewerId]);
  if (Number.isFinite(storedCount) && storedCount >= 0) {
    return Math.floor(storedCount);
  }

  const readAt = Date.parse(match.readAtByUser?.[viewerId] || match.matchedAt || match.createdAt || 0);
  return messages.filter((message) => {
    if (senderIdForMessage(message) === viewerId) {
      return false;
    }

    const messageAt = Date.parse(message.createdAt || 0);
    return Number.isFinite(messageAt) && messageAt > readAt;
  }).length;
}

function senderIdForMessage(message) {
  return text(message.senderId || message.sender?.id || message.sender?._id || message.sender);
}

function markMatchRead(match, userId, now = new Date().toISOString()) {
  return {
    ...match,
    readAtByUser: {
      ...(match.readAtByUser || {}),
      [userId]: now,
    },
    unreadByUser: {
      ...(match.unreadByUser || {}),
      [userId]: 0,
    },
    updatedAt: now,
  };
}

function applyOutgoingMessageState(match, senderId, content, now = new Date().toISOString()) {
  const unreadByUser = { ...(match.unreadByUser || {}) };
  const readAtByUser = { ...(match.readAtByUser || {}) };
  for (const participant of match.participants || []) {
    if (participant === senderId) {
      unreadByUser[participant] = 0;
      readAtByUser[participant] = now;
    } else {
      unreadByUser[participant] = Math.max(0, Number(unreadByUser[participant]) || 0) + 1;
    }
  }

  return {
    ...match,
    lastMessageAt: now,
    lastMessagePreview: text(content).slice(0, 80),
    lastMessageSenderId: senderId,
    readAtByUser,
    unreadByUser,
    updatedAt: now,
  };
}

function normalizePrivacyRequestType(type) {
  const value = text(type).toLowerCase();
  if (["delete_profile", "delete_account"].includes(value)) {
    return value;
  }

  return "";
}

function privacyRequestTypeLabel(type) {
  return type === "delete_account" ? "Account deletion" : "Profile data deletion";
}

function privacyRequestStatusLabel(status) {
  return {
    pending: "Pending",
    completed: "Completed",
    rejected: "Rejected",
    cancelled: "Cancelled",
  }[status] || "Pending";
}

function normalizePrivacyRequest(request) {
  const type = normalizePrivacyRequestType(request?.type) || "delete_profile";
  const status = ["pending", "completed", "rejected", "cancelled"].includes(text(request?.status).toLowerCase())
    ? text(request.status).toLowerCase()
    : "pending";

  return {
    id: text(request?.id) || makeId("privacy"),
    type,
    typeLabel: privacyRequestTypeLabel(type),
    reason: text(request?.reason).slice(0, 500),
    status,
    statusLabel: privacyRequestStatusLabel(status),
    requestedAt: request?.requestedAt || new Date().toISOString(),
    reviewedAt: request?.reviewedAt || null,
    completedAt: request?.completedAt || null,
    cancelledAt: request?.cancelledAt || null,
    reviewedBy: text(request?.reviewedBy),
    notes: text(request?.notes),
  };
}

function normalizePrivacyRequests(user) {
  return Array.isArray(user?.privacyRequests)
    ? user.privacyRequests.map(normalizePrivacyRequest)
    : [];
}

function adminPrivacyRequest(user, request) {
  const normalizedUser = normalizeUserRecord(user);
  return {
    ...request,
    requestId: request.id,
    userId: normalizedUser.id,
    userEmail: normalizedUser.email,
    userNickname: normalizedUser.nickname,
    userSchool: normalizedUser.school,
    userMajor: normalizedUser.major,
    userGrade: normalizedUser.grade,
    accountStatus: normalizedUser.accountStatus || "active",
  };
}

async function reviewPrivacyRequest(store, targetUser, { requestId, status, notes, reviewer }) {
  const requests = normalizePrivacyRequests(targetUser);
  const index = requests.findIndex((request) => request.id === requestId);
  if (index < 0) {
    throw httpError("Request not found", 404);
  }

  const action = status === "reject" || status === "rejected" ? "rejected" : "completed";
  const now = new Date().toISOString();
  const reviewedRequest = {
    ...requests[index],
    status: action,
    statusLabel: privacyRequestStatusLabel(action),
    notes,
    reviewedBy: reviewer?.email || reviewer?.id || "",
    reviewedAt: now,
    completedAt: action === "completed" ? now : null,
  };
  const nextRequests = [...requests];
  nextRequests[index] = reviewedRequest;

  let updatedUser = {
    ...targetUser,
    privacyRequests: nextRequests,
    privacyRequestStatus: nextRequests.some((request) => request.status === "pending") ? "pending" : action,
    updatedAt: now,
  };

  if (action === "completed") {
    updatedUser = await applyPrivacyRequestCompletion(store, updatedUser, reviewedRequest, now);
  }

  await saveUser(store, updatedUser);
  return {
    user: updatedUser,
    request: reviewedRequest,
    message: action === "completed" ? "Privacy request completed" : "Privacy request rejected",
  };
}

async function applyPrivacyRequestCompletion(store, user, request, now) {
  await redactUserMessagesAndMatches(store, user, now);
  await deleteStoredCampusCard(store, user.campusCardImage);

  if (request.type === "delete_account") {
    return {
      ...anonymizeUserProfile(user, now, true),
      email: `deleted+${user.id}@campus-match.local`,
      accountStatus: "deleted",
      deletedAt: now,
      passwordHash: "",
      passwordSalt: "",
      membership: createDefaultMembership(now),
    };
  }

  return {
    ...anonymizeUserProfile(user, now, false),
    email: user.email,
    accountStatus: "active",
    passwordHash: user.passwordHash,
    passwordSalt: user.passwordSalt,
  };
}

function anonymizeUserProfile(user, now, deleted) {
  return {
    ...user,
    studentId: "",
    nickname: deleted ? "Deleted user" : "Profile cleared",
    school: "",
    grade: "",
    major: "",
    college: "",
    campusZone: "",
    dormArea: "",
    bio: "",
    tags: [],
    sceneTags: [],
    matchModes: [],
    schedule: "",
    idealScene: "",
    relationshipGoal: "",
    allowAnonymousMatch: false,
    allowOfflineEvents: false,
    campusCardImage: "",
    avatar: "",
    isVerified: false,
    verificationStatus: "unverified",
    verificationBadge: "",
    verificationRequestedAt: null,
    verificationReviewedAt: null,
    verificationNotes: "",
    skippedIds: [],
    stats: { matches: 0, likes: 0, views: 0 },
    updatedAt: now,
  };
}

async function deleteStoredCampusCard(store, campusCardImage) {
  const image = text(campusCardImage);
  if (!image.startsWith("/api/uploads/")) {
    return;
  }

  const key = `uploads/${image.replace(/^\/api\/uploads\//, "")}`;
  await store.delete(key).catch(() => {});
}

async function redactUserMessagesAndMatches(store, user, now) {
  const matches = await listMatches(store);
  for (const match of matches) {
    if (!Array.isArray(match.participants) || !match.participants.includes(user.id)) {
      continue;
    }

    const messages = await getMessages(store, match.id);
    const redactedMessages = messages.map((message) => {
      if (senderIdForMessage(message) !== user.id) {
        return message;
      }

      return {
        ...message,
        content: "[Message deleted]",
        sender: {
          id: user.id,
          _id: user.id,
          nickname: "Deleted user",
        },
        redactedAt: now,
      };
    });
    await store.setJSON(`messages/${match.id}`, redactedMessages);

    const snapshots = { ...(match.userSnapshots || {}) };
    if (snapshots[user.id]) {
      snapshots[user.id] = {
        id: user.id,
        _id: user.id,
        nickname: "Deleted user",
        school: "",
        major: "",
        grade: "",
        isVerified: false,
      };
    }

    await saveMatch(store, {
      ...match,
      userSnapshots: snapshots,
      revealRequests: (match.revealRequests || []).filter((id) => id !== user.id),
      identityRevealed: false,
      updatedAt: now,
    });
  }
}

function assertAccountCanLogin(user) {
  if (user?.accountStatus === "deleted") {
    throw httpError("Account has been deleted", 403);
  }
}

function isActiveUser(user) {
  return user?.accountStatus !== "deleted";
}

function publicUser(user) {
  const normalizedUser = normalizeUserRecord(user);
  const { passwordHash, passwordSalt, skippedIds, privacyRequests, privacyRequestStatus, ...safeUser } = normalizedUser;

  return {
    ...safeUser,
    id: normalizedUser.id,
    _id: normalizedUser.id,
    isAdmin: hasAdminAccess(normalizedUser),
  };
}

function adminExportUser(user) {
  const normalizedUser = normalizeUserRecord(user);
  const { passwordHash, passwordSalt, skippedIds, ...safeUser } = normalizedUser;
  return {
    ...safeUser,
    id: normalizedUser.id,
    _id: normalizedUser.id,
    isAdmin: hasAdminAccess(normalizedUser),
  };
}

function requireAdmin(user) {
  if (!hasAdminAccess(user)) {
    throw httpError("没有管理员权限", 403);
  }
}

function hasAdminAccess(user) {
  return Boolean(user?.isAdmin) || isAdminEmail(user?.email);
}

function isAdminEmail(email) {
  const adminEmails = getEnv("CAMPUS_ADMIN_EMAILS")
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);

  return adminEmails.includes(normalizeEmail(email));
}

function getEnv(name) {
  return globalThis.Netlify?.env?.get(name) || process.env[name] || "";
}

function buildMembershipPayload(user) {
  const membership = normalizeMembershipRecord(user?.membership, user?.createdAt);
  return {
    membership,
    plans: getMembershipPlans(),
    recommendedPlan: membership.planId === "free" ? "plus" : "premium",
  };
}

function getMembershipPlans() {
  return MEMBERSHIP_PLAN_ORDER.map((planId) => {
    const plan = MEMBERSHIP_PLAN_LIBRARY[planId];
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      features: [...plan.features],
      limits: { ...plan.limits },
    };
  });
}

function createDefaultMembership(now = new Date().toISOString()) {
  const plan = MEMBERSHIP_PLAN_LIBRARY.free;
  return {
    type: plan.id,
    planId: plan.id,
    title: plan.name,
    status: "active",
    billingCycle: null,
    price: 0,
    currency: "CNY",
    startedAt: now,
    expiresAt: null,
    renewedAt: now,
    autoRenew: false,
    description: plan.description,
    features: [...plan.features],
    limits: { ...plan.limits },
  };
}

function activateMembershipPlan(rawMembership, planId, billingCycle) {
  const now = new Date().toISOString();
  if (planId === "free") {
    return createDefaultMembership(now);
  }

  const plan = MEMBERSHIP_PLAN_LIBRARY[planId];
  const cycle = billingCycle === "yearly" ? "yearly" : "monthly";
  const months = cycle === "yearly" ? 12 : 1;
  const currentMembership = normalizeMembershipRecord(rawMembership, now);
  const shouldExtendSamePlan = currentMembership.planId === planId
    && currentMembership.expiresAt
    && Date.parse(currentMembership.expiresAt) > Date.now();
  const anchor = shouldExtendSamePlan ? currentMembership.expiresAt : now;
  const startedAt = shouldExtendSamePlan ? currentMembership.startedAt || now : now;

  return normalizeMembershipRecord({
    type: plan.id,
    planId: plan.id,
    status: "active",
    billingCycle: cycle,
    price: cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice,
    startedAt,
    expiresAt: addMonths(anchor, months),
    renewedAt: now,
    autoRenew: false,
  }, startedAt);
}

function normalizeMembershipRecord(rawMembership, fallbackStartedAt = new Date().toISOString()) {
  if (!rawMembership || (!rawMembership.planId && !rawMembership.type) || text(rawMembership.planId || rawMembership.type).toLowerCase() === "free") {
    const membership = createDefaultMembership(rawMembership?.startedAt || fallbackStartedAt);
    return {
      ...membership,
      status: rawMembership?.status === "expired" ? "expired" : "active",
      renewedAt: rawMembership?.renewedAt || membership.renewedAt,
    };
  }

  const planId = text(rawMembership.planId || rawMembership.type).toLowerCase();
  const plan = MEMBERSHIP_PLAN_LIBRARY[planId];
  if (!plan) {
    return createDefaultMembership(fallbackStartedAt);
  }

  const billingCycle = text(rawMembership.billingCycle).toLowerCase() === "yearly" ? "yearly" : "monthly";
  const startedAt = rawMembership.startedAt || fallbackStartedAt;
  const expiresAt = rawMembership.expiresAt || addMonths(startedAt, billingCycle === "yearly" ? 12 : 1);

  if (Date.parse(expiresAt) <= Date.now()) {
    return {
      ...createDefaultMembership(fallbackStartedAt),
      status: "expired",
      previousPlanId: plan.id,
      previousTitle: plan.name,
      expiredAt: expiresAt,
    };
  }

  return {
    type: plan.id,
    planId: plan.id,
    title: plan.name,
    status: rawMembership.status || "active",
    billingCycle,
    price: Number.isFinite(Number(rawMembership.price))
      ? Number(rawMembership.price)
      : (billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice),
    currency: "CNY",
    startedAt,
    expiresAt,
    renewedAt: rawMembership.renewedAt || rawMembership.updatedAt || startedAt,
    autoRenew: Boolean(rawMembership.autoRenew),
    description: plan.description,
    features: [...plan.features],
    limits: { ...plan.limits },
  };
}

function normalizeUserRecord(user) {
  if (!user) {
    return null;
  }

  return {
    ...user,
    membership: normalizeMembershipRecord(user.membership, user.createdAt),
    stats: normalizeUserStats(user.stats),
    tags: arrayOfText(user.tags),
    sceneTags: arrayOfText(user.sceneTags),
    matchModes: arrayOfText(user.matchModes),
    skippedIds: Array.isArray(user.skippedIds) ? user.skippedIds.map(text).filter(Boolean) : [],
    privacyRequests: normalizePrivacyRequests(user),
    privacyRequestStatus: text(user.privacyRequestStatus) || "none",
    accountStatus: text(user.accountStatus) || "active",
  };
}

function normalizeUserStats(stats) {
  return {
    matches: 0,
    likes: 0,
    views: 0,
    ...(stats || {}),
  };
}

async function createEmailVerification(store, email) {
  const key = `email-codes/${encodeURIComponent(email)}`;
  const existing = await store.get(key, { type: "json" });
  if (existing?.requestedAt && Date.now() - Date.parse(existing.requestedAt) < EMAIL_CODE_RESEND_MS) {
    throw httpError("验证码发送太频繁，请稍后再试", 429);
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const now = new Date().toISOString();
  await store.setJSON(key, {
    email,
    codeHash: hashEmailCode(email, code),
    requestedAt: now,
    expiresAt: new Date(Date.now() + EMAIL_CODE_TTL_MS).toISOString(),
    attempts: 0,
  });

  return { code };
}

async function verifyEmailCode(store, email, code) {
  if (!code) {
    throw httpError("请填写邮箱验证码", 400);
  }

  const key = `email-codes/${encodeURIComponent(email)}`;
  const record = await store.get(key, { type: "json" });
  if (!record) {
    throw httpError("请先获取邮箱验证码", 400);
  }

  if (Date.parse(record.expiresAt) < Date.now()) {
    await store.delete(key);
    throw httpError("验证码已过期，请重新获取", 400);
  }

  if ((record.attempts || 0) >= 5) {
    await store.delete(key);
    throw httpError("验证码错误次数过多，请重新获取", 400);
  }

  if (record.codeHash !== hashEmailCode(email, code)) {
    await store.setJSON(key, { ...record, attempts: (record.attempts || 0) + 1 });
    throw httpError("验证码不正确", 400);
  }

  await store.delete(key);
}

async function sendVerificationEmail(email, code) {
  const config = getSmtpConfig();
  if (!config) {
    if (getEnv("EMAIL_VERIFICATION_DEBUG") === "true") {
      return;
    }

    throw httpError("邮件服务还未配置，请先设置 QQ 邮箱 SMTP 授权码", 503);
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: "校园匹配注册验证码",
    text: `你的校园匹配注册验证码是：${code}。10 分钟内有效。`,
    html: `<p>你的校园匹配注册验证码是：</p><p style="font-size:24px;font-weight:700;letter-spacing:4px;">${code}</p><p>10 分钟内有效。</p>`,
  });
}

function getSmtpConfig() {
  const user = getEnv("QQ_SMTP_USER") || getEnv("SMTP_USER");
  const pass = getEnv("QQ_SMTP_AUTH_CODE") || getEnv("SMTP_PASS");
  if (!user || !pass) {
    return null;
  }

  const port = Number(getEnv("SMTP_PORT") || 465);
  return {
    host: getEnv("SMTP_HOST") || "smtp.qq.com",
    port,
    secure: getEnv("SMTP_SECURE") ? getEnv("SMTP_SECURE") !== "false" : port === 465,
    user,
    pass,
    from: getEnv("SMTP_FROM") || `校园匹配 <${user}>`,
  };
}

function isEmailVerificationActive() {
  return Boolean(getSmtpConfig()) || getEnv("EMAIL_VERIFICATION_DEBUG") === "true" || getEnv("EMAIL_VERIFICATION_REQUIRED") === "true";
}

function isAllowedRegistrationEmail(email) {
  if (!email) {
    return false;
  }

  if (email.endsWith("@qq.com") || email.endsWith("@foxmail.com")) {
    return true;
  }

  return isAdminEmail(email) || getEnv("ALLOW_NON_QQ_EMAILS") === "true";
}

function hashEmailCode(email, code) {
  const secret = getEnv("EMAIL_CODE_SECRET") || "campus-match-email-code";
  return crypto.createHash("sha256").update(`${normalizeEmail(email)}:${text(code)}:${secret}`).digest("hex");
}

async function searchUsers(store, viewer, url) {
  const query = text(url.searchParams.get("q"));
  const school = text(url.searchParams.get("school"));
  const major = text(url.searchParams.get("major"));
  const grade = text(url.searchParams.get("grade"));
  const limit = clampNumber(url.searchParams.get("limit"), 1, 50, 12);
  const page = clampNumber(url.searchParams.get("page"), 1, 999, 1);
  const offset = (page - 1) * limit;
  const skipped = new Set(viewer.skippedIds || []);

  const databaseUsers = await searchUsersInDatabase({ viewer, query, school, major, grade, limit, offset });
  const rows = databaseUsers?.length ? databaseUsers : await searchUsersInBlobs(store, { viewer, query, school, major, grade });
  const merged = rows
    .filter((item) => isActiveUser(item) && item.id !== viewer.id && !skipped.has(item.id));
  const uniqueUsers = uniqueById(merged);
  const fallbackSeedUsers = uniqueUsers.length ? [] : filterSeedProfiles({ viewer, query, school, major, grade })
    .filter((item) => !skipped.has(item.id));
  const users = uniqueById([...uniqueUsers, ...fallbackSeedUsers]);

  return {
    users: users.slice(0, limit),
    pagination: { page, limit, total: users.length },
    query: { q: query, school, major, grade },
    source: databaseUsers?.length ? "database" : fallbackSeedUsers.length ? "seed" : store.kind === "mysql" ? "mysql" : "blobs",
  };
}

async function searchUsersInDatabase({ viewer, query, school, major, grade, limit, offset }) {
  try {
    const sql = await getSql();
    if (!sql) {
      return null;
    }

    await ensureDatabase(sql);
    const like = `%${query}%`;
    const rows = await sql`
      SELECT id, email, nickname, school, major, college, grade, bio, campus_zone, dorm_area,
             verification_status, verification_badge, is_verified, scene_tags, match_modes, updated_at
      FROM campus_users
      WHERE id <> ${viewer.id}
        AND (${query} = '' OR searchable_text ILIKE ${like})
        AND (${school} = '' OR school = ${school})
        AND (${major} = '' OR major ILIKE ${`%${major}%`})
        AND (${grade} = '' OR grade = ${grade})
      ORDER BY is_verified DESC, updated_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return rows.map(publicUserFromDatabase);
  } catch (error) {
    console.warn("Database search unavailable", error);
    return null;
  }
}

async function searchUsersInBlobs(store, filters) {
  const users = (await listUsers(store)).filter(isActiveUser).map(publicUser);
  return users.filter((user) => matchesSearchFilters(user, filters));
}

function filterSeedProfiles(filters) {
  return seedProfiles().filter((user) => matchesSearchFilters(user, filters));
}

function matchesSearchFilters(user, { viewer, query, school, major, grade }) {
  if (viewer && user.id === viewer.id) {
    return false;
  }

  if (school && user.school !== school) {
    return false;
  }

  if (major && !String(user.major || "").includes(major)) {
    return false;
  }

  if (grade && user.grade !== grade) {
    return false;
  }

  if (!query) {
    return true;
  }

  const haystack = [
    user.nickname,
    user.school,
    user.major,
    user.college,
    user.grade,
    user.bio,
    ...(user.tags || []),
    ...(user.sceneTags || []),
    ...(user.matchModes || []),
  ].join(" ").toLowerCase();

  return haystack.includes(query.toLowerCase());
}

async function indexUserInDatabase(user) {
  try {
    const sql = await getSql();
    if (!sql) {
      return;
    }

    await ensureDatabase(sql);
    if (user.accountStatus === "deleted") {
      await sql`DELETE FROM campus_users WHERE id = ${user.id}`;
      return;
    }

    const safe = publicUser(user);
    const searchableText = [
      safe.nickname,
      safe.email,
      safe.school,
      safe.major,
      safe.college,
      safe.grade,
      safe.bio,
      ...(safe.tags || []),
      ...(safe.sceneTags || []),
      ...(safe.matchModes || []),
    ].join(" ");

    await sql`
      INSERT INTO campus_users (
        id, email, nickname, school, major, college, grade, bio, campus_zone, dorm_area,
        verification_status, verification_badge, is_verified, scene_tags, match_modes, searchable_text, updated_at, created_at
      ) VALUES (
        ${safe.id}, ${safe.email}, ${safe.nickname || ""}, ${safe.school || ""}, ${safe.major || ""},
        ${safe.college || ""}, ${safe.grade || ""}, ${safe.bio || ""}, ${safe.campusZone || ""},
        ${safe.dormArea || ""}, ${safe.verificationStatus || ""}, ${safe.verificationBadge || ""},
        ${Boolean(safe.isVerified)}, CAST(${JSON.stringify(safe.sceneTags || [])} AS jsonb), CAST(${JSON.stringify(safe.matchModes || [])} AS jsonb),
        ${searchableText}, NOW(), ${safe.createdAt || new Date().toISOString()}
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        nickname = EXCLUDED.nickname,
        school = EXCLUDED.school,
        major = EXCLUDED.major,
        college = EXCLUDED.college,
        grade = EXCLUDED.grade,
        bio = EXCLUDED.bio,
        campus_zone = EXCLUDED.campus_zone,
        dorm_area = EXCLUDED.dorm_area,
        verification_status = EXCLUDED.verification_status,
        verification_badge = EXCLUDED.verification_badge,
        is_verified = EXCLUDED.is_verified,
        scene_tags = EXCLUDED.scene_tags,
        match_modes = EXCLUDED.match_modes,
        searchable_text = EXCLUDED.searchable_text,
        updated_at = NOW()
    `;
  } catch (error) {
    console.warn("Database user index unavailable", error);
  }
}

async function getSql() {
  if (sqlClient) {
    return sqlClient;
  }

  if (!getEnv("NETLIFY_DATABASE_URL")) {
    return null;
  }

  try {
    sqlClient = neon();
    return sqlClient;
  } catch (error) {
    console.warn("Database client unavailable", error);
    return null;
  }
}

async function ensureDatabase(sql) {
  if (dbReady) {
    return;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS campus_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      nickname TEXT,
      school TEXT,
      major TEXT,
      college TEXT,
      grade TEXT,
      bio TEXT,
      campus_zone TEXT,
      dorm_area TEXT,
      verification_status TEXT,
      verification_badge TEXT,
      is_verified BOOLEAN DEFAULT FALSE,
      scene_tags JSONB DEFAULT '[]'::jsonb,
      match_modes JSONB DEFAULT '[]'::jsonb,
      searchable_text TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS campus_users_searchable_idx ON campus_users USING gin (to_tsvector('simple', coalesce(searchable_text, '')))`;
  await sql`CREATE INDEX IF NOT EXISTS campus_users_school_idx ON campus_users (school)`;
  await sql`CREATE INDEX IF NOT EXISTS campus_users_major_idx ON campus_users (major)`;
  await sql`CREATE INDEX IF NOT EXISTS campus_users_grade_idx ON campus_users (grade)`;
  dbReady = true;
}

function publicUserFromDatabase(row) {
  return {
    id: row.id,
    _id: row.id,
    email: row.email,
    nickname: row.nickname,
    school: row.school,
    major: row.major,
    college: row.college,
    grade: row.grade,
    campusZone: row.campus_zone,
    dormArea: row.dorm_area,
    bio: row.bio,
    verificationStatus: row.verification_status,
    verificationBadge: row.verification_badge,
    isVerified: row.is_verified,
    sceneTags: row.scene_tags || [],
    matchModes: row.match_modes || [],
    avatar: null,
    updatedAt: row.updated_at,
    stats: { matches: 0, likes: 0, views: 0 },
  };
}

function uniqueById(users) {
  const seen = new Set();
  return users.filter((user) => {
    const id = user.id || user._id;
    if (!id || seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
}

function extensionFromContentType(contentType) {
  return {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }[contentType] || "bin";
}

function contentTypeFromKey(key) {
  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (key.endsWith(".png")) {
    return "image/png";
  }

  if (key.endsWith(".webp")) {
    return "image/webp";
  }

  return "application/octet-stream";
}

function bumpStat(user, statName) {
  return {
    ...user,
    stats: {
      matches: 0,
      likes: 0,
      views: 0,
      ...(user.stats || {}),
      [statName]: ((user.stats || {})[statName] || 0) + 1,
    },
    updatedAt: new Date().toISOString(),
  };
}

function seedProfiles() {
  return [
    {
      id: "seed-library-ning",
      _id: "seed-library-ning",
      nickname: "图书馆阿宁",
      school: "北京大学",
      major: "法学",
      college: "法学院",
      grade: "大三",
      campusZone: "本部",
      dormArea: "燕南园",
      bio: "常驻图书馆，想找一起学习和散步的人。",
      verificationBadge: "北京大学 认证",
      verificationStatus: "approved",
      isVerified: true,
      matchModes: ["学习搭子", "散步搭子"],
      sceneTags: ["图书馆", "自习"],
      avatar: null,
      stats: { matches: 8, likes: 31, views: 126 },
    },
    {
      id: "seed-runner-zhou",
      _id: "seed-runner-zhou",
      nickname: "夜跑小周",
      school: "北京大学",
      major: "新闻学",
      college: "新闻与传播学院",
      grade: "大二",
      campusZone: "本部",
      dormArea: "畅春园",
      bio: "晚上喜欢操场夜跑，也爱轻松聊天。",
      verificationBadge: "北京大学 认证",
      verificationStatus: "approved",
      isVerified: true,
      matchModes: ["运动搭子", "散步搭子"],
      sceneTags: ["夜跑", "操场"],
      avatar: null,
      stats: { matches: 5, likes: 19, views: 88 },
    },
    {
      id: "seed-food-senior",
      _id: "seed-food-senior",
      nickname: "干饭学姐",
      school: "北京大学",
      major: "经济学",
      college: "经济学院",
      grade: "研一",
      campusZone: "本部",
      dormArea: "万柳",
      bio: "研究食堂地图，也愿意一起探店。",
      verificationBadge: "北京大学 认证",
      verificationStatus: "approved",
      isVerified: true,
      matchModes: ["干饭搭子", "探店搭子"],
      sceneTags: ["食堂", "探店"],
      avatar: null,
      stats: { matches: 12, likes: 44, views: 173 },
    },
  ];
}

async function readBody(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function hashPassword(password) {
  const passwordSalt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.scryptSync(password, passwordSalt, 64).toString("hex");
  return { passwordHash, passwordSalt };
}

function verifyPassword(password, user) {
  if (!password || !user?.passwordHash || !user?.passwordSalt) {
    return false;
  }

  const expected = Buffer.from(user.passwordHash, "hex");
  const actual = crypto.scryptSync(password, user.passwordSalt, 64);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function text(value) {
  return String(value || "").trim();
}

function arrayOfText(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(text).filter(Boolean);
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(Math.max(Math.floor(number), min), max);
}

function addMonths(value, months) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  const copy = new Date(date);
  copy.setUTCMonth(copy.getUTCMonth() + months);
  return copy.toISOString();
}
