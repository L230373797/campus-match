(() => {
  const state = {
    token: localStorage.getItem("token") || "",
    user: null,
    pendingUsers: [],
    privacyRequests: [],
    activeTab: "verification",
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
  const verificationTab = document.querySelector("#tab-verification");
  const privacyTab = document.querySelector("#tab-privacy");

  loginForm.addEventListener("submit", handleLogin);
  refreshButton.addEventListener("click", () => loadCurrentQueue());
  logoutButton.addEventListener("click", logout);
  verificationTab.addEventListener("click", () => switchTab("verification"));
  privacyTab.addEventListener("click", () => switchTab("privacy"));

  boot().catch((error) => {
    showLogin(error.message || "管理员端暂时无法打开");
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
        showLogin("当前账号不是管理员，请使用管理员账号登录。");
        return;
      }

      showAdmin();
      await loadCurrentQueue();
    } catch {
      logout("登录已过期，请重新登录管理员端。");
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    loginMessage.textContent = "";
    const button = loginForm.querySelector("button");
    button.disabled = true;
    button.textContent = "登录中...";

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
        throw new Error("这个账号不是管理员，不能进入审核后台。");
      }

      showAdmin();
      await loadCurrentQueue();
    } catch (error) {
      loginMessage.textContent = error.message || "登录失败";
    } finally {
      button.disabled = false;
      button.textContent = "进入管理员端";
    }
  }

  function switchTab(tab) {
    if (state.activeTab === tab) {
      return;
    }

    state.activeTab = tab;
    verificationTab.classList.toggle("active", tab === "verification");
    privacyTab.classList.toggle("active", tab === "privacy");
    if (adminTitle) {
      adminTitle.textContent = tab === "privacy" ? "隐私请求处理" : "校园认证审核";
    }
    setNotice("");
    loadCurrentQueue();
  }

  function loadCurrentQueue() {
    return state.activeTab === "privacy" ? loadPrivacyRequests() : loadPendingUsers();
  }

  async function loadPendingUsers() {
    setNotice("");
    refreshButton.disabled = true;
    refreshButton.textContent = "刷新中...";
    queue.innerHTML = `<div class="loading glass">正在读取待审核申请...</div>`;

    try {
      const payload = await requestApi("/users/verification/pending");
      state.pendingUsers = payload.data?.users || [];
      pendingCount.textContent = `待审核 ${state.pendingUsers.length}`;
      lastRefresh.textContent = `刷新于 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
      renderQueue();
    } catch (error) {
      queue.innerHTML = "";
      setNotice(error.message || "读取待审核列表失败");
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = "刷新列表";
    }
  }

  async function loadPrivacyRequests() {
    setNotice("");
    refreshButton.disabled = true;
    refreshButton.textContent = "刷新中...";
    queue.innerHTML = `<div class="loading glass">正在读取隐私请求...</div>`;

    try {
      const payload = await requestApi("/admin/privacy-requests");
      state.privacyRequests = payload.data?.requests || [];
      const pending = state.privacyRequests.filter((request) => request.status === "pending").length;
      pendingCount.textContent = `待处理 ${pending}`;
      lastRefresh.textContent = `刷新于 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
      renderPrivacyQueue();
    } catch (error) {
      queue.innerHTML = "";
      setNotice(error.message || "读取隐私请求失败");
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = "刷新列表";
    }
  }

  function renderQueue() {
    if (!state.pendingUsers.length) {
      queue.innerHTML = `<div class="empty glass">当前没有待审核认证申请。</div>`;
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
      queue.innerHTML = `<div class="empty glass">当前没有待处理的隐私请求。</div>`;
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
          <strong>用户说明</strong>
          <p>${escapeHtml(request.reason || "用户没有填写原因")}</p>
        </div>

        <label>
          处理备注
          <textarea data-privacy-notes="${escapeAttr(request.requestId)}" placeholder="填写处理说明，用户端会看到这条记录。">${escapeHtml(request.notes || "")}</textarea>
        </label>

        <div class="review-actions">
          <button class="button secondary" type="button" data-user-id="${escapeAttr(request.userId)}" data-request-id="${escapeAttr(request.requestId)}" data-privacy-action="reject" ${busy ? "disabled" : ""}>驳回</button>
          <button class="button danger" type="button" data-user-id="${escapeAttr(request.userId)}" data-request-id="${escapeAttr(request.requestId)}" data-privacy-action="complete" ${busy ? "disabled" : ""}>完成处理</button>
        </div>
      </article>
    `;
  }

  async function reviewPrivacyRequest(userId, requestId, action) {
    const notes = Array.from(queue.querySelectorAll("[data-privacy-notes]"))
      .find((field) => field.dataset.privacyNotes === requestId)?.value || "";
    const confirmed = action !== "complete" || window.confirm("确认已核验并完成这个隐私请求吗？完成后可能会清空资料或注销账号。");
    if (!confirmed) {
      return;
    }

    state.busyUserId = requestId;
    renderPrivacyQueue();
    setNotice(action === "complete" ? "正在完成隐私请求..." : "正在驳回隐私请求...");

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
      setNotice(payload.message || "处理完成");
      state.privacyRequests = state.privacyRequests.map((request) => (
        request.requestId === requestId ? payload.data.request : request
      ));
      const pending = state.privacyRequests.filter((request) => request.status === "pending").length;
      pendingCount.textContent = `待处理 ${pending}`;
      renderPrivacyQueue();
    } catch (error) {
      setNotice(error.message || "处理失败");
    } finally {
      state.busyUserId = "";
      renderPrivacyQueue();
    }
  }

  function privacyTypeLabel(type) {
    return type === "delete_account" ? "注销账号" : "删除资料";
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
          <span class="badge">待审核</span>
        </div>

        <div class="details">
          <div class="detail"><strong>邮箱</strong>${escapeHtml(user.email || "未填写")}</div>
          <div class="detail"><strong>学号</strong>${escapeHtml(user.studentId || "未填写")}</div>
          <div class="detail"><strong>学院</strong>${escapeHtml(user.college || "未填写")}</div>
          <div class="detail"><strong>宿舍 / 校区</strong>${escapeHtml([user.dormArea, user.campusZone].filter(Boolean).join(" · ") || "未填写")}</div>
        </div>

        <div class="campus-card">
          ${imageUrl ? `<a href="${escapeAttr(imageUrl)}" target="_blank" rel="noreferrer">打开校园卡原图</a><img src="${escapeAttr(imageUrl)}" alt="校园卡照片" loading="lazy" />` : `<div class="detail"><strong>校园卡照片</strong>未上传</div>`}
        </div>

        <label>
          审核备注
          <textarea data-notes="${escapeAttr(id)}" placeholder="可填写通过或驳回原因，用户端会保留审核记录。">${escapeHtml(user.verificationNotes || "")}</textarea>
        </label>

        <div class="review-actions">
          <button class="button danger" type="button" data-user-id="${escapeAttr(id)}" data-action="reject" ${busy ? "disabled" : ""}>驳回</button>
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
    setNotice(action === "approve" ? "正在通过认证..." : "正在驳回申请...");

    try {
      const payload = await requestApi("/users/verification/review", {
        method: "POST",
        body: JSON.stringify({ userId, action, notes }),
      });
      setNotice(payload.message || "审核已完成");
      state.pendingUsers = state.pendingUsers.filter((user) => (user.id || user._id) !== userId);
      pendingCount.textContent = `待审核 ${state.pendingUsers.length}`;
      renderQueue();
    } catch (error) {
      setNotice(error.message || "审核失败");
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
      throw new Error(payload.message || `请求失败：${response.status}`);
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
    if (adminTitle) {
      adminTitle.textContent = state.activeTab === "privacy" ? "隐私请求处理" : "校园认证审核";
    }
    adminSubtitle.textContent = `${state.user?.nickname || state.user?.email || "管理员"} · 管理员端`;
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

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
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
