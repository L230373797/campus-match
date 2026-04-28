(() => {
  const state = {
    token: localStorage.getItem("token") || "",
    user: null,
    pendingUsers: [],
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

  loginForm.addEventListener("submit", handleLogin);
  refreshButton.addEventListener("click", () => loadPendingUsers());
  logoutButton.addEventListener("click", logout);

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
      await loadPendingUsers();
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
      await loadPendingUsers();
    } catch (error) {
      loginMessage.textContent = error.message || "登录失败";
    } finally {
      button.disabled = false;
      button.textContent = "进入管理员端";
    }
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
