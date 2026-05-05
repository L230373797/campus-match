(() => {
  const state = {
    token: localStorage.getItem("token") || "",
    user: null,
    overview: null,
    users: [],
    userQuery: "",
    userStatus: "all",
    pendingUsers: [],
    privacyRequests: [],
    discussions: [],
    discussionStatus: "queue",
    adminAccounts: [],
    activeTab: ["users", "verification", "privacy", "discussions", "accounts"].includes(window.location.hash.slice(1))
      ? window.location.hash.slice(1)
      : "overview",
    busyUserId: "",
  };

  const loginView = document.querySelector("#login-view");
  const adminView = document.querySelector("#admin-view");
  const loginForm = document.querySelector("#login-form");
  const loginMessage = document.querySelector("#login-message");
  const adminSubtitle = document.querySelector("#admin-subtitle");
  const queue = document.querySelector("#queue");
  const notice = document.querySelector("#notice");
  const pendingCount = document.querySelector("#pending-count");
  const lastRefresh = document.querySelector("#last-refresh");
  const refreshButton = document.querySelector("#refresh");
  const logoutButton = document.querySelector("#logout");
  const adminTitle = document.querySelector("#admin-view h1");
  const overviewTab = document.querySelector("#tab-overview");
  const usersTab = document.querySelector("#tab-users");
  const verificationTab = document.querySelector("#tab-verification");
  const privacyTab = document.querySelector("#tab-privacy");
  const discussionsTab = document.querySelector("#tab-discussions");
  const accountsTab = document.querySelector("#tab-accounts");

  loginForm.addEventListener("submit", handleLogin);
  refreshButton.addEventListener("click", () => loadCurrentQueue());
  logoutButton.addEventListener("click", logout);
  overviewTab.addEventListener("click", () => switchTab("overview"));
  usersTab.addEventListener("click", () => switchTab("users"));
  verificationTab.addEventListener("click", () => switchTab("verification"));
  privacyTab.addEventListener("click", () => switchTab("privacy"));
  discussionsTab?.addEventListener("click", () => switchTab("discussions"));
  accountsTab?.addEventListener("click", () => switchTab("accounts"));

  boot().catch((error) => {
    showLogin(error.message || "运营后台暂时无法打开");
  });

  async function boot() {
    if (!state.token) {
      showLogin("");
      return;
    }

    try {
      const payload = await requestApi("/auth/me");
      state.user = payload.data?.user || null;
      if (!state.user?.isAdmin) {
        showLogin("当前账号没有后台权限，请使用运营账号登录。");
        return;
      }

      showAdmin();
      await loadCurrentQueue();
    } catch {
      logout("登录已过期，请重新登录运营后台。");
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    loginMessage.textContent = "";
    const button = loginForm.querySelector("button");
    button.disabled = true;
    button.textContent = "正在进入...";

    try {
      const email = document.querySelector("#email").value.trim();
      const password = document.querySelector("#password").value;
      const payload = await requestApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        auth: false,
      });
      state.token = payload.data?.token || "";
      localStorage.setItem("token", state.token);

      const me = await requestApi("/auth/me");
      state.user = me.data?.user || null;
      if (!state.user?.isAdmin) {
        localStorage.removeItem("token");
        state.token = "";
        throw new Error("这个账号没有后台权限，不能进入运营后台。");
      }

      showAdmin();
      await loadCurrentQueue();
    } catch (error) {
      loginMessage.textContent = error.message || "登录没有成功";
    } finally {
      button.disabled = false;
      button.textContent = "进入运营后台";
    }
  }

  function switchTab(tab) {
    if (state.activeTab === tab) {
      return;
    }

    state.activeTab = tab;
    syncTabState();
    if (adminTitle) {
      adminTitle.textContent = tabTitle(tab);
    }
    setNotice("");
    loadCurrentQueue();
  }

  function loadCurrentQueue() {
    if (state.activeTab === "overview") {
      return loadOverview();
    }
    if (state.activeTab === "users") {
      return loadUsers();
    }
    if (state.activeTab === "accounts") {
      return loadAdminAccounts();
    }
    if (state.activeTab === "discussions") {
      return loadDiscussions();
    }
    return state.activeTab === "privacy" ? loadPrivacyRequests() : loadPendingUsers();
  }

  async function loadOverview() {
    setNotice("");
    refreshButton.disabled = true;
    refreshButton.textContent = "正在刷新...";
    queue.innerHTML = `<div class="loading glass">正在整理运营看板...</div>`;

    try {
      const payload = await requestApi("/admin/overview");
      state.overview = payload.data || {};
      const counts = state.overview.counts || {};
      const pendingTotal =
        Number(counts.pendingVerification || 0) +
        Number(counts.pendingPrivacyRequests || 0) +
        Number(counts.pendingDiscussions || 0) +
        Number(counts.pendingTreeholes || 0) +
        Number(counts.reportedMessages || 0);
      pendingCount.textContent = `待处理 ${pendingTotal}`;
      lastRefresh.textContent = `更新于 ${formatTime(state.overview.generatedAt)}`;
      renderOverview();
    } catch (error) {
      queue.innerHTML = "";
      setNotice(error.message || "数据看板读取失败");
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = "刷新看板";
    }
  }

  async function loadUsers() {
    setNotice("");
    refreshButton.disabled = true;
    refreshButton.textContent = "正在刷新...";
    queue.innerHTML = `<div class="loading glass">正在读取用户列表...</div>`;

    try {
      const params = new URLSearchParams();
      if (state.userQuery) {
        params.set("q", state.userQuery);
      }
      if (state.userStatus !== "all") {
        params.set("status", state.userStatus);
      }
      const payload = await requestApi(`/admin/users${params.toString() ? `?${params}` : ""}`);
      state.users = payload.data?.users || [];
      const counts = payload.data?.counts || {};
      pendingCount.textContent = `用户 ${counts.filtered ?? state.users.length}`;
      lastRefresh.textContent = `更新于 ${formatTime(payload.data?.generatedAt)}`;
      renderUsers(payload.data || {});
    } catch (error) {
      queue.innerHTML = "";
      setNotice(error.message || "用户列表读取失败");
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = "刷新用户";
    }
  }

  async function loadAdminAccounts() {
    setNotice("");
    refreshButton.disabled = true;
    refreshButton.textContent = "正在刷新...";
    queue.innerHTML = `<div class="loading glass">正在读取管理员账号...</div>`;

    try {
      const payload = await requestApi("/admin/accounts");
      state.adminAccounts = payload.data?.accounts || [];
      pendingCount.textContent = `管理员 ${state.adminAccounts.length}`;
      lastRefresh.textContent = `更新于 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
      renderAdminAccounts(payload.data || {});
    } catch (error) {
      queue.innerHTML = "";
      setNotice(error.message || "管理员账号读取失败");
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = "刷新管理员";
    }
  }

  function renderAdminAccounts(payload) {
    const currentUser = payload.currentUser || state.user || {};
    const accounts = state.adminAccounts || [];
    queue.innerHTML = `
      <section class="admin-account-grid">
        <article class="admin-account-card glass">
          <div>
            <h2>修改当前管理员密码</h2>
            <p>用于你自己登录后台和桌面管理器入口。改完后，下次登录使用新密码。</p>
          </div>
          <form id="current-password-form" class="admin-account-form">
            <label>当前密码<input name="currentPassword" type="password" autocomplete="current-password" required /></label>
            <label>新密码<input name="newPassword" type="password" autocomplete="new-password" minlength="8" required /></label>
            <label>确认新密码<input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required /></label>
            <button class="button" type="submit">保存新密码</button>
          </form>
        </article>

        <article class="admin-account-card glass">
          <div>
            <h2>新增备用管理员</h2>
            <p>建议至少保留一个备用管理员账号，避免主账号忘记密码时进不来后台。</p>
          </div>
          <form id="create-admin-form" class="admin-account-form">
            <label>邮箱<input name="email" type="email" autocomplete="email" required placeholder="例如 123456@qq.com" /></label>
            <label>昵称<input name="nickname" type="text" autocomplete="name" placeholder="备用管理员" /></label>
            <label>初始密码<input name="password" type="password" autocomplete="new-password" minlength="8" required /></label>
            <button class="button" type="submit">创建管理员</button>
          </form>
        </article>

        <article class="admin-account-card glass" style="grid-column: 1 / -1;">
          <div>
            <h2>已有管理员</h2>
            <p>当前登录：${escapeHtml(currentUser.email || "未知账号")}</p>
          </div>
          <div class="admin-list">
            ${accounts.length ? accounts.map(renderAdminAccountRow).join("") : `<div class="empty">还没有管理员账号。</div>`}
          </div>
        </article>
      </section>
    `;

    queue.querySelector("#current-password-form")?.addEventListener("submit", handleCurrentPasswordChange);
    queue.querySelector("#create-admin-form")?.addEventListener("submit", handleCreateAdminAccount);
    queue.querySelectorAll("[data-admin-reset]").forEach((form) => {
      form.addEventListener("submit", handleResetAdminPassword);
    });
  }

  function renderAdminAccountRow(account) {
    const updated = account.passwordResetAt || account.updatedAt || account.createdAt;
    return `
      <div class="admin-row">
        <div class="admin-row-main">
          <div>
            <strong>${escapeHtml(account.nickname || account.email || "管理员")}</strong>
            <span class="meta">${escapeHtml(account.email || "未填写邮箱")}</span>
          </div>
          <span class="user-badge good">管理员</span>
        </div>
        <p class="meta">最近更新：${escapeHtml(formatTime(updated))}</p>
        <form class="admin-reset-form" data-admin-reset="${escapeAttr(account.id)}">
          <input name="password" type="password" autocomplete="new-password" minlength="8" placeholder="输入新密码后重置" required />
          <button class="button secondary" type="submit">重置密码</button>
        </form>
      </div>
    `;
  }

  async function handleCurrentPasswordChange(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;
    const confirmPassword = form.confirmPassword.value;
    if (newPassword !== confirmPassword) {
      setNotice("两次输入的新密码不一致");
      return;
    }

    await submitAdminForm(form, async () => {
      const payload = await requestApi("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setNotice(payload.message || "密码已更新");
      form.reset();
    });
  }

  async function handleCreateAdminAccount(event) {
    event.preventDefault();
    const form = event.currentTarget;
    await submitAdminForm(form, async () => {
      const payload = await requestApi("/admin/accounts", {
        method: "POST",
        body: JSON.stringify({
          email: form.email.value,
          nickname: form.nickname.value,
          password: form.password.value,
        }),
      });
      setNotice(payload.message || "管理员账号已保存");
      form.reset();
      await loadAdminAccounts();
    });
  }

  async function handleResetAdminPassword(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const userId = form.dataset.adminReset;
    await submitAdminForm(form, async () => {
      const payload = await requestApi("/admin/accounts/reset-password", {
        method: "POST",
        body: JSON.stringify({ userId, newPassword: form.password.value }),
      });
      setNotice(payload.message || "管理员密码已重置");
      form.reset();
      await loadAdminAccounts();
    });
  }

  async function submitAdminForm(form, task) {
    const buttons = Array.from(form.querySelectorAll("button"));
    buttons.forEach((button) => {
      button.disabled = true;
    });
    try {
      await task();
    } catch (error) {
      setNotice(error.message || "操作没有成功");
    } finally {
      buttons.forEach((button) => {
        button.disabled = false;
      });
    }
  }

  async function loadPendingUsers() {
    setNotice("");
    refreshButton.disabled = true;
    refreshButton.textContent = "正在刷新...";
    queue.innerHTML = `<div class="loading glass">正在读取认证队列...</div>`;

    try {
      const payload = await requestApi("/users/verification/pending");
      state.pendingUsers = payload.data?.users || [];
      pendingCount.textContent = `待处理 ${state.pendingUsers.length}`;
      lastRefresh.textContent = `更新于 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
      renderQueue();
    } catch (error) {
      queue.innerHTML = "";
      setNotice(error.message || "认证队列读取失败");
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = "刷新队列";
    }
  }

  function renderOverview() {
    const overview = state.overview || {};
    const counts = overview.counts || {};
    const metrics = [
      { label: "用户总数", value: counts.users || 0, helper: `今日新增 ${counts.newUsersToday || 0}` },
      { label: "校园认证", value: counts.verifiedUsers || 0, helper: `待审核 ${counts.pendingVerification || 0}` },
      { label: "合拍关系", value: counts.matches || 0, helper: `聊天消息 ${counts.messages || 0}` },
      { label: "测友讨论", value: counts.discussions || 0, helper: `待复核 ${counts.pendingDiscussions || 0}` },
      { label: "测试报告", value: counts.testReports || 0, helper: `树洞待复核 ${counts.pendingTreeholes || 0}` },
      { label: "内容安全", value: counts.reportedMessages || 0, helper: `资料请求 ${counts.pendingPrivacyRequests || 0}` },
    ];

    queue.innerHTML = `
      <section class="overview-grid">
        ${metrics.map((metric) => `
          <article class="metric-card glass">
            <span>${escapeHtml(metric.label)}</span>
            <strong>${escapeHtml(metric.value)}</strong>
            <p>${escapeHtml(metric.helper)}</p>
          </article>
        `).join("")}
      </section>

      <section class="overview-panels">
        <article class="overview-panel glass">
          <h2>最近加入</h2>
          <div class="activity-list">
            ${renderRecentUsers(overview.recentUsers || [])}
          </div>
        </article>
        <article class="overview-panel glass">
          <h2>最近聊天</h2>
          <div class="activity-list">
            ${renderRecentMessages(overview.recentMessages || [])}
          </div>
        </article>
      </section>
    `;
  }

  function renderUsers(payload) {
    const counts = payload.counts || {};
    const users = state.users || [];
    queue.innerHTML = `
      <section class="user-tools glass">
        <input id="user-search" type="search" placeholder="搜索昵称、邮箱、学校、专业" value="${escapeAttr(state.userQuery)}" />
        <select id="user-status">
          ${[
            ["all", `全部用户 ${counts.all ?? ""}`],
            ["verified", `已认证 ${counts.verified ?? ""}`],
            ["pending", `待认证 ${counts.pending ?? ""}`],
            ["rejected", `认证驳回 ${counts.rejected ?? ""}`],
            ["member", `会员 ${counts.members ?? ""}`],
          ].map(([value, label]) => `<option value="${value}" ${state.userStatus === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
        </select>
      </section>
      ${users.length ? `
        <section class="user-grid">
          ${users.map(renderUserManageCard).join("")}
        </section>
      ` : `<div class="empty glass">没有找到符合条件的用户。</div>`}
    `;

    const searchInput = queue.querySelector("#user-search");
    const statusSelect = queue.querySelector("#user-status");
    let searchTimer = 0;
    searchInput?.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.userQuery = searchInput.value.trim();
        loadUsers();
      }, 260);
    });
    statusSelect?.addEventListener("change", () => {
      state.userStatus = statusSelect.value;
      loadUsers();
    });
  }

  function renderUserManageCard(user) {
    const readiness = user.readiness?.score ?? 0;
    const status = verificationLabel(user.verificationStatus, user.isVerified);
    const latestPrivacy = user.latestPrivacyRequest
      ? `${privacyTypeLabel(user.latestPrivacyRequest.type)} · ${privacyStatusLabel(user.latestPrivacyRequest.status)}`
      : "无资料请求";
    const avatar = user.avatar
      ? `<img src="${escapeAttr(user.avatar)}" alt="${escapeAttr(user.nickname || "用户头像")}" loading="lazy" />`
      : escapeHtml(firstNameLetter(user.nickname || user.email));

    return `
      <article class="user-card glass">
        <div class="user-head">
          <div class="user-avatar">${avatar}</div>
          <div class="user-name">
            <h2>${escapeHtml(user.nickname || "未命名用户")}</h2>
            <p class="meta">${escapeHtml(user.email || "未填写邮箱")}</p>
          </div>
        </div>

        <div class="user-badges">
          <span class="user-badge ${status.tone}">${escapeHtml(status.label)}</span>
          <span class="user-badge ${user.membership?.planId !== "free" ? "good" : ""}">${escapeHtml(user.membership?.title || "免费用户")}</span>
          ${user.isAdmin ? `<span class="user-badge good">管理员</span>` : ""}
        </div>

        <p class="meta">${escapeHtml([user.school, user.major, user.grade].filter(Boolean).join(" · ") || "资料未填写完整")}</p>

        <div class="readiness" style="--score: ${Number(readiness) || 0}%">
          <div class="readiness-head">
            <span>主页准备度</span>
            <strong>${escapeHtml(readiness)}%</strong>
          </div>
          <div class="readiness-bar"><span></span></div>
        </div>

        <div class="user-metrics">
          <span class="pill">匹配 ${escapeHtml(user.stats?.matches || 0)}</span>
          <span class="pill">喜欢 ${escapeHtml(user.stats?.likes || 0)}</span>
          <span class="pill">浏览 ${escapeHtml(user.stats?.views || 0)}</span>
        </div>

        <div class="details">
          <div class="detail"><strong>学号</strong>${escapeHtml(user.studentId || "未填写")}</div>
          <div class="detail"><strong>学院</strong>${escapeHtml(user.college || "未填写")}</div>
          <div class="detail"><strong>资料请求</strong>${escapeHtml(latestPrivacy)}</div>
          <div class="detail"><strong>加入时间</strong>${escapeHtml(formatTime(user.createdAt))}</div>
        </div>
      </article>
    `;
  }

  function renderRecentUsers(users) {
    if (!users.length) {
      return `<div class="empty">还没有用户数据。</div>`;
    }

    return users.map((user) => `
      <div class="activity-item">
        <div>
          <strong>${escapeHtml(user.nickname || "未命名用户")}</strong>
          <p>${escapeHtml([user.school, user.major, user.grade].filter(Boolean).join(" · ") || user.email || "资料待完善")}</p>
        </div>
        <span class="activity-time">${escapeHtml(formatTime(user.createdAt))}</span>
      </div>
    `).join("");
  }

  function renderRecentMessages(messages) {
    if (!messages.length) {
      return `<div class="empty">还没有聊天消息。</div>`;
    }

    return messages.map((message) => `
      <div class="activity-item">
        <div>
          <strong>${escapeHtml(message.senderNickname || "用户")}</strong>
          <p>${escapeHtml(message.content || "空消息")}</p>
        </div>
        <span class="activity-time">${escapeHtml(formatTime(message.createdAt))}</span>
      </div>
    `).join("");
  }

  async function loadPrivacyRequests() {
    setNotice("");
    refreshButton.disabled = true;
    refreshButton.textContent = "正在刷新...";
    queue.innerHTML = `<div class="loading glass">正在读取账号资料请求...</div>`;

    try {
      const payload = await requestApi("/admin/privacy-requests");
      state.privacyRequests = payload.data?.requests || [];
      const pending = state.privacyRequests.filter((request) => request.status === "pending").length;
      pendingCount.textContent = `待处理 ${pending}`;
      lastRefresh.textContent = `更新于 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
      renderPrivacyQueue();
    } catch (error) {
      queue.innerHTML = "";
      setNotice(error.message || "账号资料请求读取失败");
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = "刷新队列";
    }
  }

  async function loadDiscussions() {
    setNotice("");
    refreshButton.disabled = true;
    refreshButton.textContent = "正在刷新...";
    queue.innerHTML = `<div class="loading glass">正在读取测友讨论...</div>`;

    try {
      const payload = await requestApi(`/admin/discussions?status=${encodeURIComponent(state.discussionStatus)}`);
      state.discussions = payload.data?.discussions || [];
      const counts = payload.data?.counts || {};
      pendingCount.textContent = `待复核 ${counts.queue || 0}`;
      lastRefresh.textContent = `更新于 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
      renderDiscussionQueue(payload.data || {});
    } catch (error) {
      queue.innerHTML = "";
      setNotice(error.message || "测友讨论读取失败");
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = "刷新队列";
    }
  }

  function renderDiscussionQueue(payload) {
    const counts = payload.counts || {};
    const statusOptions = [
      ["queue", `待复核 ${counts.queue ?? 0}`],
      ["reported", `被举报 ${counts.reported ?? 0}`],
      ["hidden", `已隐藏 ${counts.hidden ?? 0}`],
      ["active", `公开中 ${counts.active ?? 0}`],
      ["all", `全部 ${counts.all ?? 0}`],
    ];

    queue.innerHTML = `
      <section class="user-tools glass">
        <select id="discussion-status">
          ${statusOptions.map(([value, label]) => `<option value="${value}" ${state.discussionStatus === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
        </select>
        <p class="meta">关键词命中、被举报或自动隐藏的内容会进入这里。严重敏感内容会在发布时直接拦截。</p>
      </section>
      ${state.discussions.length ? state.discussions.map(renderDiscussionCard).join("") : `<div class="empty glass">当前没有需要处理的测友讨论。</div>`}
    `;

    queue.querySelector("#discussion-status")?.addEventListener("change", (event) => {
      state.discussionStatus = event.target.value;
      loadDiscussions();
    });
    queue.querySelectorAll("[data-discussion-action]").forEach((button) => {
      button.addEventListener("click", () => {
        moderateDiscussion(button.dataset.discussionId, button.dataset.discussionAction);
      });
    });
  }

  function renderDiscussionCard(discussion) {
    const busy = state.busyUserId === discussion.id;
    const author = discussion.author || {};
    const reports = Array.isArray(discussion.reports) ? discussion.reports : [];
    const replies = Array.isArray(discussion.replies) ? discussion.replies : [];
    const hits = Array.isArray(discussion.moderationHits) ? discussion.moderationHits : [];
    const reactions = discussion.reactionCounts || {};
    return `
      <article class="review-card glass">
        <div class="review-head">
          <div>
            <h2 class="name">${escapeHtml(discussion.packTitle || "校园测友讨论")}</h2>
            <p class="meta">${escapeHtml([author.nickname, author.school, author.major, author.grade].filter(Boolean).join(" · ") || "匿名测友")}</p>
            <p class="meta">发布于 ${escapeHtml(formatTime(discussion.createdAt))} · 状态：${escapeHtml(discussionStatusLabel(discussion.status))}</p>
          </div>
          <span class="badge">${escapeHtml(discussion.reportCount || reports.length || 0)} 次举报</span>
        </div>

        <div class="privacy-reason">
          <strong>讨论内容</strong>
          <p>${escapeHtml(discussion.content || "")}</p>
        </div>

        <div class="details">
          <div class="detail"><strong>匿名</strong>${discussion.anonymous ? "是" : "否"}</div>
          <div class="detail"><strong>共鸣</strong>${escapeHtml(reactions.resonate || 0)}</div>
          <div class="detail"><strong>点赞</strong>${escapeHtml(reactions.like || 0)}</div>
          <div class="detail"><strong>回复</strong>${escapeHtml(replies.length || discussion.replyCount || 0)}</div>
        </div>

        ${hits.length ? `<div class="privacy-reason"><strong>风险关键词</strong><p>${escapeHtml(hits.join("、"))}</p></div>` : ""}
        ${reports.length ? `<div class="privacy-reason"><strong>举报原因</strong><p>${escapeHtml(reports.map((report) => report.reason || "用户举报").join("、"))}</p></div>` : ""}
        ${replies.length ? `<div class="privacy-reason"><strong>最近回复</strong><p>${escapeHtml(replies.slice(0, 3).map((reply) => `${reply.author?.nickname || "测友"}：${reply.content}`).join(" / "))}</p></div>` : ""}

        <label>
          处理记录
          <textarea data-discussion-notes="${escapeAttr(discussion.id)}" placeholder="填写隐藏、恢复或复核说明。">${escapeHtml(discussion.reviewNotes || discussion.hiddenReason || "")}</textarea>
        </label>

        <div class="review-actions">
          <button class="button danger" type="button" data-discussion-id="${escapeAttr(discussion.id)}" data-discussion-action="hide" ${busy || discussion.hidden ? "disabled" : ""}>隐藏内容</button>
          <button class="button secondary" type="button" data-discussion-id="${escapeAttr(discussion.id)}" data-discussion-action="resolve" ${busy ? "disabled" : ""}>标记已处理</button>
          <button class="button" type="button" data-discussion-id="${escapeAttr(discussion.id)}" data-discussion-action="restore" ${busy || !discussion.hidden ? "disabled" : ""}>恢复公开</button>
        </div>
      </article>
    `;
  }

  async function moderateDiscussion(discussionId, action) {
    const notes = Array.from(queue.querySelectorAll("[data-discussion-notes]"))
      .find((field) => field.dataset.discussionNotes === discussionId)?.value || "";
    state.busyUserId = discussionId;
    renderDiscussionQueue({ counts: {}, discussions: state.discussions });
    setNotice("正在处理测友讨论...");

    try {
      const payload = await requestApi(`/admin/discussions/${encodeURIComponent(discussionId)}/moderate`, {
        method: "POST",
        body: JSON.stringify({ action, notes }),
      });
      setNotice(payload.message || "测友讨论已处理");
      await loadDiscussions();
    } catch (error) {
      setNotice(error.message || "处理没有成功");
    } finally {
      state.busyUserId = "";
    }
  }

  function renderQueue() {
    if (!state.pendingUsers.length) {
      queue.innerHTML = `<div class="empty glass">当前没有待处理的认证申请。</div>`;
      return;
    }

    queue.innerHTML = state.pendingUsers.map(renderUserCard).join("");
    queue.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        reviewUser(button.dataset.userId, button.dataset.action);
      });
    });
  }

  function renderPrivacyQueue() {
    const pendingRequests = state.privacyRequests.filter((request) => request.status === "pending");
    if (!pendingRequests.length) {
      queue.innerHTML = `<div class="empty glass">当前没有待处理的账号资料请求。</div>`;
      return;
    }

    queue.innerHTML = pendingRequests.map(renderPrivacyRequestCard).join("");
    queue.querySelectorAll("[data-privacy-action]").forEach((button) => {
      button.addEventListener("click", () => {
        reviewPrivacyRequest(button.dataset.userId, button.dataset.requestId, button.dataset.privacyAction);
      });
    });
  }

  function renderPrivacyRequestCard(request) {
    const busy = state.busyUserId === request.requestId;
    const requestedAt = request.requestedAt
      ? new Date(request.requestedAt).toLocaleString("zh-CN")
      : "未知";

    return `
      <article class="review-card glass">
        <div class="review-head">
          <div>
            <h2 class="name">${escapeHtml(request.userNickname || "未命名用户")}</h2>
            <p class="meta">${escapeHtml(request.userEmail || "未填写邮箱")}</p>
            <p class="meta">${escapeHtml([request.userSchool, request.userMajor, request.userGrade].filter(Boolean).join(" · ") || "资料未填写完整")}</p>
            <p class="meta">提交时间：${escapeHtml(requestedAt)}</p>
          </div>
          <span class="badge">${escapeHtml(privacyTypeLabel(request.type))}</span>
        </div>

        <div class="privacy-reason">
          <strong>用户填写的说明</strong>
          <p>${escapeHtml(request.reason || "用户未填写说明")}</p>
        </div>

        <label>
          处理记录
          <textarea data-privacy-notes="${escapeAttr(request.requestId)}" placeholder="填写处理结果或补充说明，用户端会看到这条记录。">${escapeHtml(request.notes || "")}</textarea>
        </label>

        <div class="review-actions">
          <button class="button secondary" type="button" data-user-id="${escapeAttr(request.userId)}" data-request-id="${escapeAttr(request.requestId)}" data-privacy-action="reject" ${busy ? "disabled" : ""}>驳回请求</button>
          <button class="button danger" type="button" data-user-id="${escapeAttr(request.userId)}" data-request-id="${escapeAttr(request.requestId)}" data-privacy-action="complete" ${busy ? "disabled" : ""}>确认完成</button>
        </div>
      </article>
    `;
  }

  async function reviewPrivacyRequest(userId, requestId, action) {
    const notes = Array.from(queue.querySelectorAll("[data-privacy-notes]"))
      .find((field) => field.dataset.privacyNotes === requestId)?.value || "";
    const confirmed = action !== "complete" || window.confirm("确认完成该账号资料请求吗？完成后可能会清空资料或注销账号。");
    if (!confirmed) {
      return;
    }

    state.busyUserId = requestId;
    renderPrivacyQueue();
    setNotice(action === "complete" ? "正在完成账号资料请求..." : "正在驳回账号资料请求...");

    try {
      const payload = await requestApi("/admin/privacy-requests/review", {
        method: "POST",
        body: JSON.stringify({
          userId,
          requestId,
          status: action === "complete" ? "completed" : "rejected",
          notes,
        }),
      });
      setNotice(payload.message || "账号资料请求已处理");
      state.privacyRequests = state.privacyRequests.map((request) => (
        request.requestId === requestId ? payload.data.request : request
      ));
      const pending = state.privacyRequests.filter((request) => request.status === "pending").length;
      pendingCount.textContent = `待处理 ${pending}`;
      renderPrivacyQueue();
    } catch (error) {
      setNotice(error.message || "处理没有成功");
    } finally {
      state.busyUserId = "";
      renderPrivacyQueue();
    }
  }

  function privacyTypeLabel(type) {
    return type === "delete_account" ? "注销账号" : "清空资料";
  }

  function renderUserCard(user) {
    const id = user.id || user._id;
    const imageUrl = user.campusCardImage || "";
    const requestedAt = user.verificationRequestedAt
      ? new Date(user.verificationRequestedAt).toLocaleString("zh-CN")
      : "未知";
    const busy = state.busyUserId === id;

    return `
      <article class="review-card glass" data-user-card="${escapeHtml(id)}">
        <div class="review-head">
          <div>
            <h2 class="name">${escapeHtml(user.nickname || "未命名用户")}</h2>
            <p class="meta">${escapeHtml(user.school || "未设置学校")} · ${escapeHtml(user.major || "未设置专业")} · ${escapeHtml(user.grade || "未设置年级")}</p>
            <p class="meta">申请时间：${escapeHtml(requestedAt)}</p>
          </div>
          <span class="badge">待处理</span>
        </div>

        <div class="details">
          <div class="detail"><strong>邮箱</strong>${escapeHtml(user.email || "未填写")}</div>
          <div class="detail"><strong>学号</strong>${escapeHtml(user.studentId || "未填写")}</div>
          <div class="detail"><strong>学院</strong>${escapeHtml(user.college || "未填写")}</div>
          <div class="detail"><strong>宿舍 / 校区</strong>${escapeHtml([user.dormArea, user.campusZone].filter(Boolean).join(" · ") || "未填写")}</div>
        </div>

        <div class="campus-card">
          ${imageUrl ? `<a href="${escapeAttr(imageUrl)}" target="_blank" rel="noreferrer">查看校园卡原图</a><img src="${escapeAttr(imageUrl)}" alt="校园卡照片" loading="lazy" />` : `<div class="detail"><strong>校园卡照片</strong>未上传</div>`}
        </div>

        <label>
          处理记录
          <textarea data-notes="${escapeAttr(id)}" placeholder="可填写通过或驳回原因，用户端会保留这条记录。">${escapeHtml(user.verificationNotes || "")}</textarea>
        </label>

        <div class="review-actions">
          <button class="button danger" type="button" data-user-id="${escapeAttr(id)}" data-action="reject" ${busy ? "disabled" : ""}>驳回申请</button>
          <button class="button" type="button" data-user-id="${escapeAttr(id)}" data-action="approve" ${busy ? "disabled" : ""}>通过认证</button>
        </div>
      </article>
    `;
  }

  async function reviewUser(userId, action) {
    const notes = Array.from(queue.querySelectorAll("[data-notes]"))
      .find((field) => field.dataset.notes === userId)?.value || "";
    state.busyUserId = userId;
    renderQueue();
    setNotice(action === "approve" ? "正在通过认证..." : "正在驳回认证申请...");

    try {
      const payload = await requestApi("/users/verification/review", {
        method: "POST",
        body: JSON.stringify({ userId, action, notes }),
      });
      setNotice(payload.message || "认证申请已处理");
      state.pendingUsers = state.pendingUsers.filter((user) => (user.id || user._id) !== userId);
      pendingCount.textContent = `待处理 ${state.pendingUsers.length}`;
      renderQueue();
    } catch (error) {
      setNotice(error.message || "认证处理没有成功");
    } finally {
      state.busyUserId = "";
      renderQueue();
    }
  }

  async function requestApi(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const useAuth = options.auth !== false;
    if (useAuth && state.token) {
      headers.Authorization = `Bearer ${state.token}`;
    }
    if (!headers["Content-Type"] && options.body) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`/api${path}`, {
      ...options,
      headers,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || `请求未成功：${response.status}`);
    }

    return payload;
  }

  function showLogin(message = "") {
    loginView.classList.remove("hidden");
    adminView.classList.add("hidden");
    loginMessage.textContent = message;
  }

  function showAdmin() {
    loginView.classList.add("hidden");
    adminView.classList.remove("hidden");
    syncTabState();
    if (adminTitle) {
      adminTitle.textContent = tabTitle(state.activeTab);
    }
    adminSubtitle.textContent = `${state.user?.nickname || state.user?.email || "运营账号"} · 运营后台`;
  }

  function syncTabState() {
    overviewTab.classList.toggle("active", state.activeTab === "overview");
    usersTab.classList.toggle("active", state.activeTab === "users");
    verificationTab.classList.toggle("active", state.activeTab === "verification");
    privacyTab.classList.toggle("active", state.activeTab === "privacy");
    discussionsTab?.classList.toggle("active", state.activeTab === "discussions");
    accountsTab?.classList.toggle("active", state.activeTab === "accounts");
  }

  function logout(message = "") {
    localStorage.removeItem("token");
    state.token = "";
    state.user = null;
    state.pendingUsers = [];
    showLogin(message);
  }

  function setNotice(message) {
    notice.textContent = message || "";
  }

  function tabTitle(tab) {
    return {
      overview: "数据看板",
      users: "用户管理",
      verification: "认证队列",
      privacy: "账号资料请求",
      discussions: "测友讨论审核",
      accounts: "管理员账号",
    }[tab] || "运营后台";
  }

  function verificationLabel(status, isVerified) {
    if (isVerified || status === "approved") {
      return { label: "已认证", tone: "good" };
    }
    if (status === "pending") {
      return { label: "待认证", tone: "warn" };
    }
    if (status === "rejected") {
      return { label: "认证驳回", tone: "danger" };
    }
    return { label: "未认证", tone: "" };
  }

  function privacyStatusLabel(status) {
    return {
      pending: "待处理",
      completed: "已完成",
      rejected: "已驳回",
      cancelled: "已撤回",
    }[status] || "无状态";
  }

  function discussionStatusLabel(status) {
    return {
      active: "公开中",
      needsReview: "待复核",
      reported: "被举报",
      hidden: "已隐藏",
    }[status] || "未分类";
  }

  function firstNameLetter(value) {
    return String(value || "用").trim().slice(0, 1).toUpperCase() || "用";
  }

  function formatTime(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) {
      return "刚刚";
    }
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

})();
