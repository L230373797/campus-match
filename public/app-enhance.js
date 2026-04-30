(() => {
  const MEMBERSHIP_PLANS = [
    {
      id: "free",
      name: "免费用户",
      description: "先来看看同校里有没有让你心动的人。",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: ["每日 12 条推荐", "基础同校匹配", "支持校园认证"],
      limits: { recommendationWindow: 12 },
    },
    {
      id: "plus",
      name: "校园会员",
      description: "适合想认真认识同校新朋友、提升曝光和筛选效率的你。",
      monthlyPrice: 19,
      yearlyPrice: 168,
      features: ["每日 30 条推荐", "高级筛选", "更高资料曝光", "优先进入同校推荐"],
      limits: { recommendationWindow: 30 },
    },
    {
      id: "premium",
      name: "高级会员",
      description: "适合想更快被看见，也想更主动把握缘分的你。",
      monthlyPrice: 39,
      yearlyPrice: 328,
      features: ["推荐浏览近乎无限", "超级曝光位", "优先审核", "专属会员身份标识"],
      limits: { recommendationWindow: 99 },
    },
  ];
  const MEMBERSHIP_LABELS = new Set(["免费用户", "校园会员", "高级会员", "会员已过期"]);
  const AVATAR_UPLOAD_MAX_BYTES = 3 * 1024 * 1024;
  const MBTI_TYPES = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
  const AUDIENCE_COPY_REPLACEMENTS = new Map([
    ["继续下滑了解业务", "继续下滑看看"],
    ["01 / 业务定位", "01 / 为什么这里不同"],
    ["不是一起全抛出来，而是边滑边看到重点", "先确认感觉，再慢慢了解彼此"],
    ["校园匹配不是泛社交广场，而是校内真实连接平台。首页改成随滚动逐段出现信息，让用户先抓到核心，再继续往下理解产品逻辑。", "这里不急着把所有人推到你面前，而是先根据同校认证、兴趣场景和相处节奏，帮你更轻松地判断谁值得认识。"],
    ["02 / 三步机制", "02 / 认识方式"],
    ["03 / 为什么这样做", "03 / 为什么安心"],
    ["04 / 适合谁", "04 / 适合你吗"],
    ["05 / 滑到底了，就开始吧", "05 / 准备好就开始"],
    ["现在首页的信息会随着滚动一段一段出现，看到最后再给注册按钮，不再一上来把所有内容一次性展示完。", "准备好了就注册账号，先从校内认证开始，再去遇见同校、同频、同节奏的人。"],
    ["像 Apple 一样轻盈顺滑地开始一段校园连接。", "轻松一点，认识更合拍的同校新朋友。"],
    ["保持业务逻辑不变，只把资料编辑区做成更统一的 Apple 风格。", "完善一点资料，推荐会更贴近你的校园节奏。"],
    ["用于后续线下闭环与真实连接", "聊得合适时，也愿意进一步线下见面。"],
    ["校园认证与资料完善", "校园认证"],
    ["你已完成校园认证，推荐权重会更高。", "你已完成校园认证，同校同学会更放心认识你。"],
    ["认证申请已提交，当前等待审核。", "校园卡已收到，我们会尽快帮你完成认证。"],
    ["认证未通过，可补充资料后重新提交。", "这次认证没有通过，可以补充资料后再试一次。"],
    ["先完善档案并提交校园卡信息，再发起校园认证。", "先完善资料并上传校园卡，就能开始校园认证。"],
    ["校园卡图片地址", "校园卡照片"],
    ["填写校园卡图片 URL，用于认证审核", "上传校园卡后会自动填入"],
    ["提交认证申请", "开始认证"],
    ["请先填写校园卡图片地址，再提交认证申请", "请先上传校园卡，再开始认证。"],
    ["个人档案", "我的资料"],
    ["编辑资料", "编辑我的资料"],
    ["保存资料", "保存更改"],
    ["保存中...", "正在保存..."],
    ["提交中...", "正在提交..."],
    ["编辑中", "正在编辑"],
    ["只读", "浏览中"],
    ["填写昵称", "怎么称呼你"],
    ["简单介绍一下你自己", "简单说说你喜欢什么、想认识怎样的人"],
    ["输入标签后回车，多个标签用中文逗号分隔", "输入后回车，或用中文逗号分开"],
    ["比如 图书馆", "比如 图书馆、自习"],
    ["比如 学习搭子", "比如 学习搭子、散步搭子"],
    ["未设置昵称", "还没填昵称"],
    ["未设置学校", "还没填学校"],
    ["未设置专业", "还没填专业"],
    ["未设置年级", "还没填年级"],
    ["未命名用户", "还没有昵称"],
    ["学院待补充", "学院还没填写"],
    ["这个同学还没写简介，先从标签了解一下吧。", "对方还没写简介，可以先看看兴趣标签。"],
    ["待认证", "还未认证"],
    ["认证未通过", "认证未通过，可重新补充"],
    ["匿名匹配开启", "匿名先聊已开启"],
    ["允许匿名匹配", "先匿名聊聊"],
    ["保持低压力的先聊后认识模式", "先不急着暴露身份，聊舒服了再决定。"],
    ["允许线下见面", "愿意线下见面"],
    ["我喜欢的", "喜欢过的人"],
    ["我的动态", "我的足迹"],
    ["隐私设置", "账号与资料"],
    ["通用设置", "使用设置"],
    ["退出登录", "退出当前账号"],
    ["找同校、同频、低压力的真实连接", "看看今天和你合拍的同校同学"],
    ["进入发现", "看看推荐"],
    ["开始匹配", "开始看看"],
    ["完善资料", "完善我的资料"],
    ["加载中...", "正在加载..."],
    ["加载失败", "没加载出来"],
    ["重试", "再试一次"],
    ["暂无推荐", "今天先到这里"],
    ["今天已经看完了所有推荐，稍后再来看看。", "今天的推荐暂时看完了，晚点再回来看看。"],
    ["刷新推荐", "再看看"],
    ["左滑跳过", "左滑略过"],
    ["上滑超级喜欢", "上滑更感兴趣"],
    ["暂时还没有可推荐的人", "暂时还没有合适的推荐"],
    ["当前账号可能还未认证，或同校已认证用户样本还不够，先完善资料再试试。", "先完善资料或完成校园认证，晚点再回来看看。"],
    ["搜索活动、圈子、同学...", "搜索同学、兴趣或想一起做的事"],
    ["同校优先推荐", "同校同学"],
    ["你们互相喜欢了对方，开始聊天吧", "互相感兴趣后，就从一句轻松的问候开始吧"],
    ["新的匹配", "新的合拍"],
    ["没有新的匹配", "暂时没有新的合拍"],
    ["还没有匹配", "还没有新的合拍"],
    ["去首页多滑动卡片，找到互相喜欢的人吧。", "多看看推荐，也许下一个就是聊得来的人。"],
    ["去发现", "去看看推荐"],
    ["登录后查看匹配", "登录后查看合拍的人"],
    ["先登录账号，才能看到互相喜欢和聊天记录", "登录后就能看到互相喜欢的人和聊天记录。"],
    ["匿名聊天中", "正在匿名聊天"],
    ["申请暴露身份", "申请互相展示身份"],
    ["向对方发送身份暴露申请，对方同意后，双方将看到彼此的真实信息", "想进一步认识时，可以申请互相展示身份。对方同意后，双方都能看到真实资料。"],
    ["双方已同意暴露身份", "双方已互相展示身份"],
    ["申请失败", "申请没有发出去"],
    ["发送申请", "发出申请"],
    ["输入消息", "输入想说的话"],
    ["发送中", "正在发送"],
  ]);
  const originalFetch = window.fetch.bind(window);
  const state = {
    token: localStorage.getItem("token"),
    user: null,
    checkedAt: 0,
    membership: null,
    loginObserver: null,
    enhanceQueued: false,
    swiperPromise: null,
    loginSwipers: [],
    loginMotionCleanup: null,
    unreadTotal: 0,
    unreadMatches: [],
    unreadPollTimer: null,
    unreadFetching: false,
    unreadCheckedAt: 0,
    messageThreads: new Map(),
    chatMatches: new Map(),
    activitySummary: null,
    activityCheckedAt: 0,
    activityFetching: false,
    activityModalType: "liked",
    privacyRequests: [],
    privacyCheckedAt: 0,
    privacyFetching: false,
    imageFallbackInstalled: false,
    baseTitle: document.title.replace(/^\(\d+\)\s*/, ""),
  };

  injectStyles();
  patchFetch();
  installCampusImageFallbacks();
  patchHistoryMethod("pushState");
  patchHistoryMethod("replaceState");

  window.addEventListener("popstate", queueEnhance);
  document.addEventListener("keydown", handleGlobalKeydown);
  document.addEventListener("click", handleLogoutClick, true);
  document.addEventListener("click", handleRouteTransitionClick, true);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      refreshUnreadSummary({ force: true }).catch(() => {});
    }
  });
  window.addEventListener("focus", () => {
    refreshUnreadSummary({ force: true }).catch(() => {});
  });

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      a[href="/admin/verification"] { display: none !important; }
      .ios-tab-item,
      .campus-unread-anchor {
        position: relative;
      }
      .campus-unread-badge {
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        display: inline-grid;
        place-items: center;
        border-radius: 999px;
        background: linear-gradient(180deg, #ff6b8a, #ff2d55);
        color: #fff;
        border: 1px solid rgba(255,255,255,.72);
        box-shadow: 0 10px 24px rgba(255,45,85,.34);
        font: 800 11px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .ios-tab-item > .campus-unread-badge,
      .campus-unread-anchor > .campus-unread-badge[data-campus-nav-badge="true"] {
        position: absolute;
        top: 6px;
        right: 18%;
        z-index: 4;
      }
      .campus-thread-unread {
        margin-left: 8px;
        vertical-align: middle;
      }
      #campus-unread-pill {
        position: fixed;
        right: max(14px, env(safe-area-inset-right));
        bottom: calc(106px + env(safe-area-inset-bottom));
        z-index: 35;
        pointer-events: auto;
      }
      #campus-unread-pill a {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 38px;
        padding: 0 13px;
        border-radius: 999px;
        color: rgba(255,255,255,.94);
        background: rgba(11, 18, 34, .66);
        border: 1px solid rgba(255,255,255,.18);
        box-shadow: 0 18px 46px rgba(0,0,0,.28), inset 0 1px rgba(255,255,255,.18);
        backdrop-filter: blur(22px) saturate(1.35);
        -webkit-backdrop-filter: blur(22px) saturate(1.35);
        font-size: 13px;
        font-weight: 750;
      }
      body[data-campus-route="/login"] #campus-unread-pill,
      body[data-campus-authenticated="false"] #campus-unread-pill {
        display: none;
      }
      @media (max-width: 640px) {
        #campus-unread-pill {
          right: 12px;
          bottom: calc(92px + env(safe-area-inset-bottom));
        }
        #campus-unread-pill a span:last-child {
          display: none;
        }
      }
      body[data-campus-route="/matches"] a[href*="/chat/"][data-campus-has-unread="true"] {
        border-color: rgba(255,45,85,.34) !important;
        box-shadow: 0 18px 48px rgba(255,45,85,.13), inset 0 1px rgba(255,255,255,.62) !important;
      }
      .campus-match-preview-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: 6px;
        min-width: 0;
      }
      .campus-match-preview-text {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: rgba(71,85,105,.82);
        font-size: 13px;
        line-height: 1.35;
        font-weight: 650;
      }
      .campus-match-preview-time {
        flex: 0 0 auto;
        color: rgba(100,116,139,.66);
        font-size: 11px;
        font-weight: 750;
        font-variant-numeric: tabular-nums;
      }
      body[data-campus-route^="/chat/"] .campus-message-row {
        scroll-margin: 88px 0 100px;
        display: flex !important;
        align-items: flex-end !important;
        gap: 9px;
        width: 100%;
        margin: 12px 0 !important;
      }
      body[data-campus-route^="/chat/"] .campus-message-row[data-campus-sender="me"] {
        justify-content: flex-end !important;
      }
      body[data-campus-route^="/chat/"] .campus-message-row[data-campus-sender="them"] {
        justify-content: flex-start !important;
      }
      body[data-campus-route^="/chat/"] .campus-message-bubble {
        position: relative;
        max-width: min(78vw, 520px);
        overflow: hidden;
        transform: translateZ(0);
        transition: transform .2s ease, box-shadow .2s ease;
        will-change: transform;
      }
      body[data-campus-route^="/chat/"] .campus-message-bubble p {
        word-break: break-word;
      }
      body[data-campus-route^="/chat/"] .campus-message-row[data-campus-sender="me"] .campus-message-bubble {
        order: 1;
      }
      body[data-campus-route^="/chat/"] .campus-message-row[data-campus-sender="them"] .campus-message-bubble {
        order: 2;
      }
      body[data-campus-route^="/chat/"] .campus-message-row[data-campus-sender="me"] .campus-message-item {
        order: 1;
      }
      body[data-campus-route^="/chat/"] .campus-message-row[data-campus-sender="them"] .campus-message-item {
        order: 2;
      }
      body[data-campus-route^="/chat/"] .campus-message-bubble.is-mine {
        border: 1px solid rgba(255,255,255,.36);
      }
      body[data-campus-route^="/chat/"] .campus-message-bubble.is-theirs {
        border: 1px solid rgba(255,255,255,.52);
        background: rgba(255,255,255,.72) !important;
        color: #111827 !important;
        box-shadow: 0 16px 34px rgba(15,23,42,.08), inset 0 1px rgba(255,255,255,.42);
      }
      body[data-campus-route^="/chat/"] .campus-message-bubble.is-mine p {
        color: #fff !important;
      }
      body[data-campus-route^="/chat/"] .campus-message-bubble.is-theirs .campus-message-time {
        color: rgba(15,23,42,.58) !important;
      }
      body[data-campus-route^="/chat/"] .campus-message-bubble.is-mine .campus-message-time {
        color: rgba(255,255,255,.76) !important;
      }
      body[data-campus-route^="/chat/"] .campus-message-time {
        font-variant-numeric: tabular-nums;
        letter-spacing: 0;
      }
      body[data-campus-route^="/chat/"] .campus-chat-avatar {
        flex: 0 0 34px;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: rgba(8,18,32,.88);
        font-size: 13px;
        font-weight: 900;
        background: linear-gradient(135deg, rgba(255,255,255,.92), rgba(184,234,255,.72), rgba(255,211,232,.72));
        background-size: cover;
        background-position: center;
        border: 1px solid rgba(255,255,255,.68);
        box-shadow: 0 10px 26px rgba(15,23,42,.13), inset 0 1px rgba(255,255,255,.72);
        overflow: hidden;
      }
      body[data-campus-route^="/chat/"] .campus-message-row[data-campus-sender="me"] .campus-chat-avatar {
        order: 2;
      }
      body[data-campus-route^="/chat/"] .campus-message-row[data-campus-sender="them"] .campus-chat-avatar {
        order: 1;
      }
      body[data-campus-route^="/chat/"] .campus-chat-avatar.has-image {
        color: transparent;
      }
      .campus-chat-header-assist,
      .campus-chat-quick-openers {
        width: min(100%, 760px);
        margin: 0 auto 14px;
        border: 1px solid rgba(255,255,255,.58);
        background: rgba(255,255,255,.62);
        box-shadow: 0 18px 46px rgba(15,23,42,.10), inset 0 1px rgba(255,255,255,.58);
        backdrop-filter: blur(22px) saturate(1.18);
        -webkit-backdrop-filter: blur(22px) saturate(1.18);
      }
      .campus-chat-header-assist {
        position: sticky;
        top: calc(10px + env(safe-area-inset-top));
        z-index: 28;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 74px;
        padding: 11px 12px;
        border-radius: 28px;
      }
      .campus-chat-header-user {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }
      .campus-chat-header-avatar {
        flex: 0 0 48px;
        width: 48px;
        height: 48px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        color: rgba(8,18,32,.9);
        font-size: 18px;
        font-weight: 950;
        background: linear-gradient(135deg, rgba(255,255,255,.95), rgba(164,232,255,.75), rgba(255,202,226,.78));
        background-size: cover;
        background-position: center;
        border: 1px solid rgba(255,255,255,.74);
        box-shadow: 0 16px 32px rgba(15,23,42,.13), inset 0 1px rgba(255,255,255,.72);
        overflow: hidden;
      }
      .campus-chat-header-avatar.has-image {
        color: transparent;
      }
      .campus-chat-header-copy {
        min-width: 0;
        display: grid;
        gap: 3px;
      }
      .campus-chat-header-copy strong {
        color: rgba(15,23,42,.94);
        font-size: 16px;
        line-height: 1.1;
        font-weight: 950;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .campus-chat-header-copy span {
        color: rgba(71,85,105,.76);
        font-size: 12px;
        line-height: 1.28;
        font-weight: 750;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .campus-chat-header-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
      }
      .campus-chat-status-pill,
      .campus-chat-profile-button,
      .campus-chat-quick-openers button,
      .campus-chat-drawer-close,
      .campus-chat-drawer-secondary {
        min-height: 36px;
        border: 0;
        border-radius: 999px;
        font-weight: 900;
        letter-spacing: 0;
      }
      .campus-chat-status-pill {
        display: inline-flex;
        align-items: center;
        padding: 0 12px;
        color: rgba(22,78,99,.92);
        background: rgba(207,250,254,.66);
        box-shadow: inset 0 0 0 1px rgba(103,232,249,.34);
        font-size: 12px;
      }
      .campus-chat-profile-button {
        padding: 0 14px;
        color: rgba(255,255,255,.96);
        background: linear-gradient(135deg, #0ea5e9, #22d3ee);
        box-shadow: 0 12px 28px rgba(14,165,233,.28);
        cursor: pointer;
      }
      .campus-chat-quick-openers {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 100%;
        order: -1;
        padding: 10px;
        border-radius: 24px;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .campus-chat-quick-openers::-webkit-scrollbar {
        display: none;
      }
      .campus-chat-quick-openers button {
        flex: 0 0 auto;
        padding: 0 13px;
        color: rgba(15,23,42,.84);
        background: rgba(255,255,255,.72);
        box-shadow: inset 0 0 0 1px rgba(148,163,184,.18), 0 10px 24px rgba(15,23,42,.07);
        cursor: pointer;
      }
      .campus-chat-profile-drawer {
        position: fixed;
        inset: 0;
        z-index: 90;
        display: none;
      }
      body[data-campus-chat-drawer="open"] .campus-chat-profile-drawer {
        display: block;
      }
      .campus-chat-drawer-scrim {
        position: absolute;
        inset: 0;
        background: rgba(8,13,24,.36);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }
      .campus-chat-drawer-panel {
        position: absolute;
        top: max(16px, env(safe-area-inset-top));
        right: max(16px, env(safe-area-inset-right));
        bottom: max(16px, env(safe-area-inset-bottom));
        width: min(390px, calc(100vw - 32px));
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 18px;
        border-radius: 32px;
        border: 1px solid rgba(255,255,255,.62);
        background: rgba(255,255,255,.78);
        box-shadow: 0 28px 90px rgba(15,23,42,.22), inset 0 1px rgba(255,255,255,.72);
        backdrop-filter: blur(28px) saturate(1.22);
        -webkit-backdrop-filter: blur(28px) saturate(1.22);
        transform: translate3d(18px, 0, 0);
        opacity: 0;
        transition: transform .24s ease, opacity .24s ease;
        overflow: auto;
      }
      body[data-campus-chat-drawer="open"] .campus-chat-drawer-panel {
        transform: translate3d(0, 0, 0);
        opacity: 1;
      }
      .campus-chat-drawer-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .campus-chat-drawer-close {
        width: 38px;
        padding: 0;
        background: rgba(15,23,42,.08);
        color: rgba(15,23,42,.72);
        cursor: pointer;
      }
      .campus-chat-drawer-hero {
        display: grid;
        justify-items: center;
        gap: 10px;
        padding: 10px 0 2px;
        text-align: center;
      }
      .campus-chat-drawer-avatar {
        width: 82px;
        height: 82px;
        border-radius: 28px;
        display: grid;
        place-items: center;
        color: rgba(8,18,32,.9);
        font-size: 30px;
        font-weight: 950;
        background: linear-gradient(135deg, rgba(255,255,255,.96), rgba(164,232,255,.78), rgba(255,202,226,.8));
        background-size: cover;
        background-position: center;
        border: 1px solid rgba(255,255,255,.76);
        box-shadow: 0 18px 42px rgba(15,23,42,.14), inset 0 1px rgba(255,255,255,.76);
        overflow: hidden;
      }
      .campus-chat-drawer-avatar.has-image {
        color: transparent;
      }
      .campus-chat-drawer-hero h3 {
        margin: 0;
        color: rgba(15,23,42,.94);
        font-size: 24px;
        line-height: 1.08;
        font-weight: 950;
      }
      .campus-chat-drawer-hero p,
      .campus-chat-drawer-section p {
        margin: 0;
        color: rgba(71,85,105,.78);
        font-size: 14px;
        line-height: 1.55;
        font-weight: 700;
      }
      .campus-chat-drawer-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .campus-chat-drawer-metric,
      .campus-chat-drawer-section {
        border-radius: 22px;
        padding: 13px;
        background: rgba(255,255,255,.64);
        box-shadow: inset 0 0 0 1px rgba(148,163,184,.14), 0 12px 30px rgba(15,23,42,.06);
      }
      .campus-chat-drawer-metric span,
      .campus-chat-drawer-section span {
        display: block;
        color: rgba(100,116,139,.74);
        font-size: 12px;
        font-weight: 850;
        margin-bottom: 4px;
      }
      .campus-chat-drawer-metric strong {
        display: block;
        color: rgba(15,23,42,.92);
        font-size: 15px;
        line-height: 1.25;
        font-weight: 950;
        word-break: break-word;
      }
      .campus-chat-drawer-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .campus-chat-drawer-tags em {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 10px;
        border-radius: 999px;
        color: rgba(22,78,99,.9);
        background: rgba(207,250,254,.64);
        font-style: normal;
        font-size: 12px;
        font-weight: 900;
      }
      .campus-chat-drawer-secondary {
        width: 100%;
        min-height: 46px;
        color: rgba(15,23,42,.88);
        background: rgba(255,255,255,.78);
        box-shadow: inset 0 0 0 1px rgba(148,163,184,.18), 0 12px 28px rgba(15,23,42,.06);
        cursor: pointer;
      }
      .campus-chat-date-chip {
        display: flex;
        justify-content: center;
        margin: 12px 0 4px;
        pointer-events: none;
      }
      .campus-chat-date-chip span {
        display: inline-flex;
        align-items: center;
        min-height: 26px;
        padding: 0 12px;
        border-radius: 999px;
        background: rgba(255,255,255,.58);
        border: 1px solid rgba(255,255,255,.7);
        color: rgba(71,85,105,.72);
        box-shadow: 0 12px 30px rgba(15,23,42,.08);
        backdrop-filter: blur(16px) saturate(1.22);
        -webkit-backdrop-filter: blur(16px) saturate(1.22);
        font-size: 12px;
        font-weight: 800;
      }
      @media (max-width: 640px) {
        .campus-match-preview-row {
          margin-top: 5px;
        }
        .campus-match-preview-time {
          display: none;
        }
        body[data-campus-route^="/chat/"] .campus-message-bubble {
          max-width: 80vw;
        }
        body[data-campus-route^="/chat/"] .campus-chat-avatar {
          flex-basis: 30px;
          width: 30px;
          height: 30px;
          font-size: 12px;
        }
        .campus-chat-header-assist {
          top: calc(8px + env(safe-area-inset-top));
          width: calc(100% - 18px);
          min-height: 66px;
          padding: 9px;
          border-radius: 24px;
        }
        .campus-chat-header-avatar {
          flex-basis: 42px;
          width: 42px;
          height: 42px;
          border-radius: 16px;
        }
        .campus-chat-status-pill {
          display: none;
        }
        .campus-chat-profile-button {
          min-width: 54px;
          padding: 0 12px;
        }
        .campus-chat-quick-openers {
          width: calc(100% - 18px);
          margin-bottom: 10px;
        }
        .campus-chat-drawer-panel {
          top: auto;
          left: 10px;
          right: 10px;
          bottom: max(10px, env(safe-area-inset-bottom));
          width: auto;
          max-height: min(82svh, 680px);
          border-radius: 30px;
          transform: translate3d(0, 24px, 0);
        }
        .campus-chat-drawer-grid {
          grid-template-columns: 1fr;
        }
      }
      .campus-code-panel { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; margin-top: 10px; }
      .campus-code-panel input {
        width: 100%;
        border-radius: 1.4rem;
        padding: 1rem 1.25rem;
        color: rgba(255,255,255,.94);
        background: rgba(255,255,255,.08);
        border: 1px solid rgba(255,255,255,.12);
        outline: none;
      }
      .campus-code-panel button,
      .campus-quick-actions a,
      .campus-membership-button,
      .campus-login-open {
        border: 0;
        border-radius: 999px;
        min-height: 46px;
        padding: 0 16px;
        font-weight: 700;
        color: #07111f;
        background: linear-gradient(180deg,#fff,#d7e5ff 62%,#ffd8e5);
        box-shadow: 0 14px 34px rgba(180,205,255,.24);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
      }
      @media (prefers-reduced-motion: no-preference) {
        html {
          scroll-behavior: smooth;
        }
      }
      .apple-card,
      .apple-btn,
      .apple-btn-secondary,
      .ios-nav-btn,
      .ios-tab-item,
      .campus-code-panel button,
      .campus-quick-actions a,
      .campus-membership-button,
      .campus-login-open {
        -webkit-tap-highlight-color: transparent;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }
      .apple-card {
        transition: transform .22s cubic-bezier(.16, 1, .3, 1), box-shadow .22s ease, border-color .22s ease, background .22s ease, opacity .18s ease !important;
        will-change: transform;
      }
      .apple-btn,
      .apple-btn-secondary,
      .ios-nav-btn,
      .ios-tab-item,
      .campus-code-panel button,
      .campus-quick-actions a,
      .campus-membership-button,
      .campus-login-open {
        transition: transform .16s cubic-bezier(.16, 1, .3, 1), box-shadow .2s ease, background .2s ease, color .18s ease, opacity .18s ease, filter .18s ease !important;
        will-change: transform;
      }
      .apple-btn:active,
      .apple-btn-secondary:active,
      .ios-nav-btn:active,
      .ios-tab-item:active,
      .campus-code-panel button:active,
      .campus-quick-actions a:active,
      .campus-membership-button:active,
      .campus-login-open:active {
        transform: translate3d(0, 1px, 0) scale(.985);
      }
      .campus-code-panel button:disabled { opacity: .55; cursor: not-allowed; }
      .campus-code-message { grid-column: 1 / -1; min-height: 18px; color: rgba(255,255,255,.66); font-size: 12px; padding-left: 4px; }
      .campus-school-native-wrap {
        display: none !important;
      }
      .campus-school-picker {
        position: relative;
        z-index: 12;
      }
      .campus-school-picker input {
        width: 100%;
      }
      .campus-school-help {
        margin: 8px 0 0 4px;
        color: rgba(83, 97, 116, .72);
        font-size: 12px;
        line-height: 1.5;
      }
      .campus-school-suggestions {
        position: static;
        margin-top: 8px;
        display: none;
        max-height: 286px;
        overflow-y: auto;
        padding: 8px;
        border: 1px solid rgba(255, 255, 255, .58);
        border-radius: 22px;
        background: rgba(255, 255, 255, .96);
        box-shadow: 0 22px 56px rgba(15, 23, 42, .2);
        backdrop-filter: blur(20px) saturate(1.24);
        -webkit-backdrop-filter: blur(20px) saturate(1.24);
      }
      .campus-school-picker.is-open .campus-school-suggestions {
        display: grid;
        gap: 6px;
      }
      .campus-school-option,
      .campus-school-empty {
        width: 100%;
        border: 0;
        border-radius: 16px;
        padding: 11px 12px;
        text-align: left;
        background: transparent;
        color: #0b1220;
      }
      .campus-school-option {
        cursor: pointer;
      }
      .campus-school-option:hover,
      .campus-school-option.is-active {
        background: rgba(0, 122, 255, .1);
      }
      .campus-school-option strong,
      .campus-school-option span,
      .campus-school-empty {
        display: block;
      }
      .campus-school-option strong {
        font-size: 14px;
      }
      .campus-school-option span,
      .campus-school-empty {
        margin-top: 4px;
        color: rgba(83, 97, 116, .78);
        font-size: 12px;
      }
      body[data-campus-route="/login"] .campus-school-option strong {
        color: #0b1220 !important;
      }
      body[data-campus-route="/login"] .campus-school-option span,
      body[data-campus-route="/login"] .campus-school-empty {
        color: rgba(83, 97, 116, .86) !important;
      }
      body[data-campus-spline="active"][data-campus-route="/login"] #root > div > .w-full.max-w-md .campus-school-option strong {
        color: #0b1220 !important;
      }
      body[data-campus-spline="active"][data-campus-route="/login"] #root > div > .w-full.max-w-md .campus-school-option span,
      body[data-campus-spline="active"][data-campus-route="/login"] #root > div > .w-full.max-w-md .campus-school-empty {
        color: rgba(83, 97, 116, .88) !important;
      }
      .campus-quick-actions {
        position: fixed;
        right: 16px;
        bottom: 104px;
        z-index: 45;
        display: none;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
        max-width: calc(100vw - 32px);
      }
      body[data-campus-authenticated="true"] .campus-quick-actions { display: flex; }
      body[data-campus-route="/login"] .campus-quick-actions,
      body[data-campus-route="/upload.html"] .campus-quick-actions,
      body[data-campus-route="/search.html"] .campus-quick-actions { display: none; }

      .campus-login-story {
        position: relative;
        z-index: 1;
        min-height: 250vh;
        color: rgba(255,255,255,.92);
      }
      .campus-login-hero,
      .campus-login-band,
      .campus-login-bottom {
        width: min(1180px, calc(100vw - 32px));
        margin: 0 auto;
      }
      .campus-login-hero {
        min-height: 100vh;
        padding: 32px 0 56px;
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(320px, .9fr);
        gap: 28px;
        align-items: end;
      }
      .campus-login-hero-copy {
        display: flex;
        flex-direction: column;
        justify-content: end;
        gap: 18px;
      }
      .campus-login-kicker {
        font-size: 12px;
        letter-spacing: .22em;
        text-transform: uppercase;
        color: rgba(223,237,255,.7);
      }
      .campus-login-hero h1 {
        margin: 0;
        font-size: clamp(3rem, 8vw, 6.3rem);
        line-height: .92;
        letter-spacing: 0;
      }
      .campus-login-hero p {
        margin: 0;
        max-width: 560px;
        color: rgba(230,240,255,.76);
        line-height: 1.8;
      }
      .campus-login-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
      }
      .campus-login-secondary {
        color: rgba(255,255,255,.74);
        text-decoration: none;
        padding: 0 4px;
      }
      .campus-login-visual {
        min-height: 66vh;
        border-radius: 32px;
        overflow: hidden;
        position: relative;
        background:
          linear-gradient(180deg, rgba(6,17,31,.05), rgba(6,17,31,.68)),
          url("/dingfang-example.jpg") center/cover no-repeat;
        box-shadow: 0 40px 100px rgba(0,0,0,.34);
      }
      .campus-login-visual::after {
        content: "";
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 24% 18%, rgba(255,255,255,.18), transparent 22%),
          linear-gradient(180deg, rgba(255,255,255,.08), transparent 40%, rgba(7,17,31,.78));
      }
      .campus-login-visual-copy {
        position: absolute;
        left: 24px;
        right: 24px;
        bottom: 24px;
        z-index: 1;
      }
      .campus-login-visual-copy strong {
        display: block;
        font-size: 1.2rem;
        margin-bottom: 8px;
      }
      .campus-login-band {
        padding: 18px 0 84px;
      }
      .campus-login-strip {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        padding: 18px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 24px;
        background: linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.06));
        backdrop-filter: blur(22px);
        box-shadow: 0 24px 70px rgba(0,0,0,.22);
      }
      .campus-login-strip strong {
        display: block;
        font-size: 1.6rem;
        margin-bottom: 6px;
      }
      .campus-login-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin-top: 18px;
      }
      .campus-carousel-shell {
        margin-top: 18px;
      }
      .campus-story-carousel {
        position: relative;
        padding: 4px 4px 42px;
        overflow: hidden;
      }
      .campus-story-carousel .swiper-wrapper {
        align-items: stretch;
      }
      .campus-story-carousel .swiper-slide {
        height: auto;
        display: flex;
      }
      .campus-story-carousel .swiper-slide.campus-login-card,
      .campus-story-carousel .swiper-slide.campus-plan-card {
        flex-direction: column;
        align-items: stretch;
      }
      .campus-story-carousel .campus-login-card,
      .campus-story-carousel .campus-plan-card {
        width: 100%;
        min-height: 100%;
      }
      .campus-story-carousel:not(.swiper-initialized) .swiper-wrapper {
        display: flex;
        gap: 16px;
        overflow-x: auto;
        overscroll-behavior-x: contain;
        scroll-snap-type: x mandatory;
        scroll-padding-left: 4px;
        padding-bottom: 6px;
        -webkit-overflow-scrolling: touch;
      }
      .campus-story-carousel:not(.swiper-initialized) .swiper-slide {
        flex: 0 0 min(86vw, 390px);
        scroll-snap-align: start;
      }
      .campus-story-carousel .swiper-pagination {
        bottom: 4px !important;
      }
      .campus-story-carousel .swiper-pagination-bullet {
        width: 7px;
        height: 7px;
        background: rgba(255,255,255,.42);
        opacity: 1;
      }
      .campus-story-carousel .swiper-pagination-bullet-active {
        width: 22px;
        border-radius: 999px;
        background: rgba(255,255,255,.9);
      }
      .campus-login-card,
      .campus-plan-card,
      .campus-membership-current,
      .campus-membership-banner {
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 24px;
        background: linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.06));
        backdrop-filter: blur(24px);
        box-shadow: 0 24px 70px rgba(0,0,0,.24);
      }
      .campus-login-card {
        padding: 22px;
      }
      .campus-login-card h3,
      .campus-plan-card h3,
      .campus-membership-current h3 {
        margin: 0 0 10px;
        font-size: 1.2rem;
      }
      .campus-login-card p,
      .campus-plan-card p,
      .campus-membership-current p {
        margin: 0;
        color: rgba(226,238,255,.76);
        line-height: 1.7;
      }
      .campus-login-bottom {
        min-height: 72vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 20px;
        padding-bottom: 22vh;
      }
      .campus-login-bottom h2 {
        margin: 0;
        font-size: clamp(2.1rem, 5vw, 3.8rem);
        line-height: .96;
      }
      .campus-login-bottom p {
        margin: 0;
        max-width: 640px;
        color: rgba(226,238,255,.72);
        line-height: 1.8;
      }
      .campus-login-bottom-trigger {
        width: 100%;
        height: 4px;
      }
      body[data-campus-route="/login"] #root { min-height: auto; }
      body[data-campus-route="/login"] #root > div {
        position: fixed !important;
        inset: 0;
        z-index: 60;
        padding: 22px 16px;
        display: flex;
        align-items: end;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        background: rgba(4,10,18,0);
        transition: opacity .32s ease, background .32s ease;
      }
      body[data-campus-route="/login"] #root > div > .w-full.max-w-md {
        width: min(680px, calc(100vw - 24px));
        max-width: min(680px, calc(100vw - 24px));
        margin: 0 auto;
        transform: translateY(48px) scale(.98);
        transition: transform .4s cubic-bezier(.22,1,.36,1);
        max-height: calc(100vh - 40px);
        overflow: auto;
      }
      body[data-campus-route="/login"] #root > div > .w-full.max-w-md .text-center.mb-8 {
        margin-bottom: 22px !important;
      }
      body[data-campus-route="/login"] #root > div > .w-full.max-w-md .w-28.h-28 {
        width: 76px !important;
        height: 76px !important;
        margin-bottom: 18px !important;
      }
      body[data-campus-route="/login"][data-campus-login-overlay="open"] #root > div {
        opacity: 1;
        pointer-events: auto;
        background: rgba(4,10,18,.68);
        backdrop-filter: blur(18px);
      }
      body[data-campus-route="/login"][data-campus-login-overlay="open"] #root > div > .w-full.max-w-md {
        transform: translateY(0) scale(1);
      }
      .campus-consent-row {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-top: 12px;
        padding: 12px 14px;
        border-radius: 18px;
        background: rgba(255,255,255,.42);
        border: 1px solid rgba(255,255,255,.46);
        color: rgba(71,85,105,.88);
        font-size: 12px;
        line-height: 1.55;
      }
      .campus-consent-row input {
        flex: 0 0 auto;
        width: 16px;
        height: 16px;
        margin-top: 2px;
        accent-color: #087fff;
      }
      .campus-consent-row a {
        color: #087fff;
        font-weight: 750;
      }

      .campus-membership-modal {
        position: fixed;
        inset: 0;
        z-index: 80;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(4,10,18,.7);
        backdrop-filter: blur(18px);
      }
      body[data-campus-membership-modal="open"] .campus-membership-modal { display: flex; }
      .campus-membership-dialog {
        width: min(1080px, calc(100vw - 24px));
        max-height: calc(100vh - 24px);
        overflow: auto;
        border-radius: 28px;
        border: 1px solid rgba(255,255,255,.14);
        background: linear-gradient(180deg, rgba(9,18,32,.96), rgba(7,14,25,.92));
        box-shadow: 0 34px 110px rgba(0,0,0,.38);
        color: rgba(255,255,255,.94);
      }
      .campus-membership-head {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 16px;
        padding: 24px 24px 10px;
      }
      .campus-membership-head h2 {
        margin: 0;
        font-size: clamp(1.8rem, 4vw, 3rem);
        line-height: .96;
      }
      .campus-membership-close {
        border: 0;
        width: 42px;
        height: 42px;
        border-radius: 999px;
        color: rgba(255,255,255,.92);
        background: rgba(255,255,255,.08);
        cursor: pointer;
      }
      .campus-membership-body {
        padding: 0 24px 24px;
      }
      .campus-membership-current {
        padding: 22px;
        margin-bottom: 18px;
      }
      .campus-membership-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 16px;
      }
      .campus-chip {
        display: inline-flex;
        align-items: center;
        min-height: 34px;
        padding: 0 12px;
        border-radius: 999px;
        background: rgba(255,255,255,.09);
        border: 1px solid rgba(255,255,255,.1);
        color: rgba(240,246,255,.84);
        font-size: 13px;
        font-weight: 600;
      }
      .campus-membership-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }
      .campus-plan-card {
        padding: 20px;
        position: relative;
      }
      .campus-plan-badge {
        display: inline-flex;
        align-items: center;
        align-self: flex-start;
        min-height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        background: rgba(255,255,255,.1);
        color: rgba(255,255,255,.82);
        font-size: 12px;
        font-weight: 700;
        margin-bottom: 14px;
        white-space: nowrap;
      }
      .campus-plan-price {
        display: flex;
        align-items: end;
        gap: 8px;
        margin: 14px 0 8px;
      }
      .campus-plan-price strong {
        font-size: 2rem;
        line-height: 1;
      }
      .campus-plan-features {
        display: grid;
        gap: 8px;
        margin: 16px 0 0;
        padding: 0;
        list-style: none;
      }
      .campus-plan-features li {
        color: rgba(230,240,255,.78);
        padding-left: 18px;
        position: relative;
      }
      .campus-plan-features li::before {
        content: "";
        position: absolute;
        left: 0;
        top: 9px;
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: linear-gradient(180deg,#fff,#b8d2ff);
      }
      .campus-plan-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 18px;
      }
      .campus-plan-actions button {
        border: 0;
        min-height: 42px;
        border-radius: 999px;
        font-weight: 700;
        cursor: pointer;
      }
      .campus-plan-actions .primary {
        color: #07111f;
        background: linear-gradient(180deg,#fff,#d7e5ff 62%,#ffd8e5);
      }
      .campus-plan-actions .secondary {
        color: rgba(255,255,255,.88);
        background: rgba(255,255,255,.08);
        border: 1px solid rgba(255,255,255,.1);
      }
      .campus-plan-actions button:disabled {
        opacity: .55;
        cursor: not-allowed;
      }
      .campus-membership-note {
        margin-top: 18px;
        color: rgba(226,238,255,.64);
        font-size: 13px;
      }
      .campus-activity-modal {
        position: fixed;
        inset: 0;
        z-index: 82;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(4,10,18,.72);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }
      body[data-campus-activity-modal="open"] .campus-activity-modal { display: flex; }
      .campus-activity-dialog {
        width: min(760px, calc(100vw - 24px));
        max-height: calc(100vh - 24px);
        overflow: auto;
        border-radius: 28px;
        border: 1px solid rgba(255,255,255,.14);
        background: linear-gradient(180deg, rgba(9,18,32,.96), rgba(7,14,25,.94));
        box-shadow: 0 34px 110px rgba(0,0,0,.38);
        color: rgba(255,255,255,.94);
      }
      .campus-activity-head {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 16px;
        padding: 22px 22px 10px;
      }
      .campus-activity-head h2 {
        margin: 0 0 7px;
        font-size: clamp(1.55rem, 5vw, 2.45rem);
        line-height: 1;
      }
      .campus-activity-head p {
        margin: 0;
        color: rgba(226,238,255,.68);
        line-height: 1.55;
      }
      .campus-activity-close {
        width: 42px;
        height: 42px;
        border: 0;
        border-radius: 999px;
        color: rgba(255,255,255,.92);
        background: rgba(255,255,255,.08);
        cursor: pointer;
      }
      .campus-activity-body {
        padding: 0 22px 22px;
      }
      .campus-activity-list {
        display: grid;
        gap: 12px;
      }
      .campus-activity-card {
        display: grid;
        grid-template-columns: 58px minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        padding: 13px;
        border-radius: 22px;
        background: rgba(255,255,255,.08);
        border: 1px solid rgba(255,255,255,.1);
      }
      .campus-activity-avatar {
        width: 58px;
        height: 58px;
        display: grid;
        place-items: center;
        overflow: hidden;
        border-radius: 19px;
        color: #07111f;
        background: linear-gradient(180deg,#fff,#d7e5ff 62%,#ffd8e5);
        font-weight: 950;
      }
      .campus-activity-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .campus-avatar-fallback {
        width: 100%;
        height: 100%;
        display: grid;
        place-items: center;
        border-radius: inherit;
        color: #07111f;
        background: linear-gradient(180deg,#fff,#d7e5ff 62%,#ffd8e5);
        font-weight: 950;
      }
      .campus-avatar-control .campus-avatar-fallback {
        border-radius: 1.5rem;
        font-size: 2rem;
      }
      .campus-activity-main {
        min-width: 0;
      }
      .campus-activity-main strong,
      .campus-activity-main span,
      .campus-activity-main small {
        display: block;
      }
      .campus-activity-main strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 1rem;
      }
      .campus-activity-main span {
        margin-top: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: rgba(226,238,255,.68);
        font-size: 13px;
      }
      .campus-activity-main small {
        margin-top: 7px;
        color: rgba(226,238,255,.5);
        font-size: 12px;
      }
      .campus-activity-action {
        min-height: 38px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 13px;
        border-radius: 999px;
        color: #07111f;
        background: linear-gradient(180deg,#fff,#d7e5ff 62%,#ffd8e5);
        text-decoration: none;
        font-size: 13px;
        font-weight: 900;
        white-space: nowrap;
      }
      button.campus-activity-action {
        border: 0;
        cursor: pointer;
      }
      .campus-activity-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        flex-wrap: wrap;
      }
      .campus-activity-danger {
        min-height: 38px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 13px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.12);
        color: rgba(255,255,255,.86);
        background: rgba(255,255,255,.08);
        text-decoration: none;
        font-size: 13px;
        font-weight: 900;
        white-space: nowrap;
        cursor: pointer;
      }
      .campus-activity-action:disabled,
      .campus-activity-danger:disabled {
        cursor: progress;
        opacity: .62;
      }
      .campus-activity-toolbar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 12px;
      }
      .campus-activity-empty {
        padding: 34px 18px;
        border-radius: 24px;
        color: rgba(226,238,255,.68);
        background: rgba(255,255,255,.08);
        text-align: center;
        line-height: 1.65;
      }
      .campus-membership-banner {
        padding: 18px 20px;
        margin: 16px 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
      }
      .campus-membership-banner strong {
        display: block;
        font-size: 1rem;
        margin-bottom: 6px;
      }
      .campus-membership-banner p {
        margin: 0;
        color: rgba(226,238,255,.76);
        line-height: 1.7;
      }
      .campus-membership-button {
        min-width: 132px;
      }
      .campus-privacy-panel {
        margin: 16px 0;
        padding: 18px 20px;
        display: grid;
        gap: 14px;
      }
      .campus-privacy-panel h3 {
        margin: 0;
        color: rgba(255,255,255,.94);
        font-size: 1.05rem;
      }
      .campus-privacy-panel p {
        margin: 0;
        color: rgba(226,238,255,.76);
        line-height: 1.7;
      }
      .campus-privacy-status {
        padding: 12px 14px;
        border-radius: 18px;
        background: rgba(255,255,255,.11);
        border: 1px solid rgba(255,255,255,.16);
        color: rgba(255,255,255,.86);
        font-size: 13px;
        line-height: 1.6;
      }
      .campus-privacy-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .campus-privacy-actions.has-cancel {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .campus-privacy-reason {
        width: 100%;
        min-height: 82px;
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,.18);
        background: rgba(255,255,255,.12);
        color: rgba(255,255,255,.9);
        padding: 14px 15px;
        resize: vertical;
        outline: none;
      }
      .campus-privacy-reason::placeholder {
        color: rgba(226,238,255,.48);
      }
      .campus-privacy-button {
        min-height: 44px;
        border-radius: 999px;
        border: 0;
        padding: 0 16px;
        font-weight: 850;
        cursor: pointer;
      }
      .campus-privacy-button.primary {
        color: #07111f;
        background: linear-gradient(180deg,#fff,#d7e5ff 62%,#ffd8e5);
      }
      .campus-privacy-button.danger {
        color: #fff;
        background: linear-gradient(180deg,#ff6b61,#ff3b30);
      }
      .campus-privacy-button.secondary {
        border: 1px solid rgba(255,255,255,.18);
        color: rgba(245,248,255,.92);
        background: rgba(255,255,255,.12);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.12);
      }
      .campus-privacy-button:disabled {
        opacity: .55;
        cursor: wait;
      }
      .campus-avatar-control {
        position: relative;
        display: inline-block;
      }
      .campus-avatar-control img {
        object-fit: cover;
      }
      .campus-avatar-upload-input {
        display: none !important;
      }
      .campus-avatar-upload-trigger {
        cursor: pointer;
      }
      .campus-avatar-control > .campus-avatar-upload-trigger {
        top: 64px !important;
        right: -4px !important;
        bottom: auto !important;
      }
      .campus-avatar-upload-trigger:disabled {
        opacity: .58;
        cursor: wait;
      }
      .campus-avatar-upload-status {
        position: absolute;
        left: 50%;
        top: calc(100% + 8px);
        width: max-content;
        max-width: 132px;
        transform: translateX(-50%);
        color: rgba(226,238,255,.64);
        font-size: 11px;
        line-height: 1.25;
        text-align: center;
        pointer-events: none;
      }
      .campus-avatar-upload-status.is-error {
        color: #ffb4ab;
      }
      .campus-avatar-sheet {
        position: fixed;
        inset: 0;
        z-index: 90;
        display: none;
        align-items: flex-end;
        justify-content: center;
        padding: 18px max(14px, env(safe-area-inset-right)) calc(18px + env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left));
        background: rgba(4,10,18,.58);
        backdrop-filter: blur(16px) saturate(1.2);
        -webkit-backdrop-filter: blur(16px) saturate(1.2);
      }
      body[data-campus-avatar-sheet="open"] .campus-avatar-sheet {
        display: flex;
      }
      .campus-avatar-sheet-panel {
        width: min(390px, 100%);
        border-radius: 28px;
        border: 1px solid rgba(255,255,255,.18);
        background: linear-gradient(180deg, rgba(20,29,43,.96), rgba(8,14,24,.94));
        box-shadow: 0 32px 90px rgba(0,0,0,.42), inset 0 1px rgba(255,255,255,.14);
        color: rgba(255,255,255,.92);
        overflow: hidden;
      }
      .campus-avatar-sheet-title {
        padding: 18px 18px 10px;
      }
      .campus-avatar-sheet-title strong {
        display: block;
        font-size: 1rem;
      }
      .campus-avatar-sheet-title span {
        display: block;
        margin-top: 5px;
        color: rgba(226,238,255,.62);
        font-size: 13px;
      }
      .campus-avatar-sheet-actions {
        display: grid;
        gap: 8px;
        padding: 8px;
      }
      .campus-avatar-sheet-actions button {
        min-height: 52px;
        border: 0;
        border-radius: 20px;
        color: rgba(255,255,255,.92);
        background: rgba(255,255,255,.1);
        font-size: 15px;
        font-weight: 850;
        cursor: pointer;
      }
      .campus-avatar-sheet-actions button.primary {
        color: #07111f;
        background: linear-gradient(180deg,#fff,#d7e5ff 62%,#ffd8e5);
      }
      .campus-avatar-sheet-actions button:active {
        transform: translateY(1px) scale(.99);
      }
      .campus-business-home {
        margin: 22px 0 0;
        display: grid;
        gap: 16px;
        color: rgba(245,248,255,.94);
        position: relative;
        isolation: isolate;
      }
      .campus-business-home::before {
        content: "";
        position: absolute;
        inset: -18px -18px -22px;
        z-index: -1;
        border-radius: 36px;
        background:
          radial-gradient(circle at 18% 0%, rgba(143,216,255,.18), transparent 36%),
          radial-gradient(circle at 100% 42%, rgba(255,216,229,.12), transparent 38%),
          linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,0));
        opacity: .88;
        pointer-events: none;
      }
      .campus-business-home > * {
        animation: campusBusinessRise .54s cubic-bezier(.2,.78,.24,1) both;
        will-change: transform, opacity;
      }
      .campus-business-home > *:nth-child(2) { animation-delay: .04s; }
      .campus-business-home > *:nth-child(3) { animation-delay: .08s; }
      .campus-business-home > *:nth-child(4) { animation-delay: .12s; }
      .campus-business-home > *:nth-child(5) { animation-delay: .16s; }
      .campus-business-home > *:nth-child(6) { animation-delay: .2s; }
      .campus-business-home > *:nth-child(7) { animation-delay: .24s; }
      @keyframes campusBusinessRise {
        from {
          opacity: 0;
          transform: translateY(16px) scale(.985);
          filter: blur(5px);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .campus-business-home > *,
        .campus-business-search,
        .campus-business-shortcut,
        .campus-business-feed-card,
        .campus-business-banner,
        .campus-business-ai {
          animation: none !important;
          transition: none !important;
        }
      }
      .campus-business-heading {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 16px;
      }
      .campus-business-heading h3 {
        margin: 0;
        font-size: clamp(1.35rem, 2.2vw, 2rem);
        line-height: 1.1;
        letter-spacing: 0;
      }
      .campus-business-heading p {
        margin: 8px 0 0;
        max-width: 620px;
        color: rgba(226,238,255,.68);
        line-height: 1.7;
      }
      .campus-business-live {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 34px;
        padding: 0 13px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.16);
        background: rgba(255,255,255,.09);
        color: rgba(245,248,255,.82);
        font-size: 12px;
        font-weight: 800;
      }
      .campus-business-live::before {
        content: "";
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #51f2c2;
        box-shadow: 0 0 18px rgba(81,242,194,.8);
      }
      .campus-business-search {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 62px;
        padding: 8px 9px 8px 18px;
        border-radius: 24px;
        border: 1px solid rgba(255,255,255,.16);
        background: linear-gradient(135deg, rgba(255,255,255,.16), rgba(255,255,255,.07));
        box-shadow: 0 18px 50px rgba(0,0,0,.18), inset 0 1px rgba(255,255,255,.18);
        backdrop-filter: blur(22px) saturate(1.25);
        -webkit-backdrop-filter: blur(22px) saturate(1.25);
        position: relative;
        overflow: hidden;
        transition: transform .24s ease, border-color .24s ease, box-shadow .24s ease;
      }
      .campus-business-search::after {
        content: "";
        position: absolute;
        inset: 1px auto 1px 1px;
        width: 42%;
        border-radius: inherit;
        background: linear-gradient(90deg, rgba(255,255,255,.13), transparent);
        opacity: .6;
        pointer-events: none;
      }
      .campus-business-search:focus-within {
        transform: translateY(-1px);
        border-color: rgba(143,216,255,.34);
        box-shadow: 0 22px 58px rgba(0,0,0,.22), 0 0 0 3px rgba(143,216,255,.09), inset 0 1px rgba(255,255,255,.2);
      }
      .campus-business-search span {
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        color: #8fd8ff;
        background: rgba(143,216,255,.12);
        font-size: 18px;
      }
      .campus-business-search input {
        min-width: 0;
        flex: 1 1 auto;
        border: 0;
        outline: none;
        background: transparent;
        color: rgba(255,255,255,.94);
        font-size: 16px;
        font-weight: 750;
      }
      .campus-business-search input::placeholder {
        color: rgba(226,238,255,.55);
      }
      .campus-business-search button,
      .campus-business-banner strong,
      .campus-business-ai {
        border: 0;
        cursor: pointer;
        min-height: 44px;
        border-radius: 999px;
        padding: 0 18px;
        color: #07111f !important;
        -webkit-text-fill-color: #07111f;
        background: linear-gradient(180deg,#fff,#d7e5ff 62%,#ffd8e5);
        font-weight: 900;
        white-space: nowrap;
        transition: transform .18s ease, filter .18s ease, box-shadow .18s ease;
      }
      .campus-business-search button:hover,
      .campus-business-banner:hover strong,
      .campus-business-ai:hover {
        transform: translateY(-1px);
        filter: saturate(1.08) brightness(1.02);
      }
      .campus-business-search button:active,
      .campus-business-banner:active strong,
      .campus-business-ai:active {
        transform: translateY(1px) scale(.985);
      }
      .campus-business-status {
        display: grid;
        grid-template-columns: 1fr;
        gap: 18px;
        align-items: stretch;
      }
      .campus-business-score,
      .campus-business-metrics,
      .campus-business-shortcut,
      .campus-business-feed-card,
      .campus-business-banner {
        border: 1px solid rgba(255,255,255,.13);
        background: linear-gradient(180deg, rgba(255,255,255,.13), rgba(255,255,255,.06));
        box-shadow: 0 18px 46px rgba(0,0,0,.18), inset 0 1px rgba(255,255,255,.14);
        backdrop-filter: blur(20px) saturate(1.2);
        -webkit-backdrop-filter: blur(20px) saturate(1.2);
      }
      .campus-business-score {
        min-height: 180px;
        padding: 22px;
        border-radius: 28px;
        display: grid;
        gap: 14px;
        position: relative;
        overflow: hidden;
        background:
          radial-gradient(circle at 18% 18%, rgba(143,216,255,.2), transparent 34%),
          radial-gradient(circle at 86% 78%, rgba(255,216,229,.12), transparent 32%),
          linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.06));
      }
      .campus-business-score::after {
        content: "";
        position: absolute;
        right: 20px;
        top: 20px;
        width: 88px;
        height: 88px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,.16);
        background: conic-gradient(from 145deg, rgba(143,216,255,.9), rgba(255,216,229,.55), rgba(255,255,255,.14), rgba(143,216,255,.9));
        -webkit-mask: radial-gradient(circle, transparent 52%, #000 54%);
        mask: radial-gradient(circle, transparent 52%, #000 54%);
        opacity: .62;
        pointer-events: none;
      }
      .campus-business-score small,
      .campus-business-shortcut small,
      .campus-business-feed-card small {
        color: rgba(226,238,255,.58);
        font-weight: 750;
      }
      .campus-business-score strong {
        font-size: clamp(3.6rem, 8vw, 5.8rem);
        line-height: .88;
        letter-spacing: 0;
        width: fit-content;
        background: linear-gradient(180deg,#fff 0%,#d8ecff 56%,#f5d5df 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 20px 56px rgba(143,216,255,.2);
      }
      .campus-business-score strong span {
        font-size: 1.1rem;
        color: rgba(226,238,255,.7);
        -webkit-text-fill-color: rgba(226,238,255,.7);
      }
      .campus-business-score p {
        max-width: 520px;
        margin: 0;
        color: rgba(226,238,255,.74);
        line-height: 1.7;
      }
      .campus-business-metrics {
        padding: 18px;
        border-radius: 28px;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        background:
          linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.055)),
          radial-gradient(circle at 50% 0%, rgba(255,255,255,.1), transparent 46%);
      }
      .campus-business-meter {
        display: grid;
        gap: 9px;
        justify-items: center;
        align-content: end;
        min-height: 138px;
        padding: 12px 6px;
        border-radius: 20px;
        background: rgba(255,255,255,.06);
        transition: transform .2s ease, background .2s ease;
      }
      .campus-business-meter:hover {
        transform: translateY(-2px);
        background: rgba(255,255,255,.09);
      }
      .campus-business-meter i {
        width: 13px;
        height: 72px;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(255,255,255,.28), var(--meter-color));
        box-shadow: 0 0 28px color-mix(in srgb, var(--meter-color) 48%, transparent);
        transform-origin: bottom;
        transform: scaleY(var(--meter-value));
      }
      .campus-business-meter b {
        font-size: 1.25rem;
      }
      .campus-business-meter span {
        color: rgba(226,238,255,.58);
        font-size: 12px;
        font-weight: 750;
      }
      .campus-business-shortcuts {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .campus-business-shortcut {
        min-height: 118px;
        padding: 15px;
        border-radius: 24px;
        display: grid;
        gap: 8px;
        text-decoration: none;
        color: rgba(245,248,255,.92);
        position: relative;
        overflow: hidden;
        transition: transform .22s ease, border-color .22s ease, background .22s ease, box-shadow .22s ease;
      }
      .campus-business-shortcut::after,
      .campus-business-feed-card::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,.13), transparent 44%);
        opacity: 0;
        transition: opacity .22s ease;
        pointer-events: none;
      }
      .campus-business-shortcut:hover,
      .campus-business-feed-card:hover,
      .campus-business-banner:hover {
        transform: translateY(-2px);
        border-color: rgba(143,216,255,.34);
        background: linear-gradient(180deg, rgba(255,255,255,.17), rgba(255,255,255,.08));
        box-shadow: 0 22px 58px rgba(0,0,0,.24), inset 0 1px rgba(255,255,255,.18);
      }
      .campus-business-shortcut:hover::after,
      .campus-business-feed-card:hover::after {
        opacity: 1;
      }
      .campus-business-icon {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 16px;
        color: #07111f !important;
        -webkit-text-fill-color: #07111f;
        background: linear-gradient(150deg, #a8ecff, #fff 52%, #ffd8e5);
        font-size: 15px;
        font-weight: 950;
        box-shadow: 0 12px 30px rgba(143,216,255,.14);
      }
      .campus-business-shortcut:nth-child(3n + 2) .campus-business-icon {
        background: linear-gradient(150deg, #ffe5a8, #fff 52%, #c6f7e6);
      }
      .campus-business-shortcut:nth-child(3n) .campus-business-icon {
        background: linear-gradient(150deg, #c7d2ff, #fff 52%, #ffd6f1);
      }
      .campus-business-shortcut b {
        font-size: 1rem;
      }
      .campus-business-badge {
        position: absolute;
        top: 13px;
        right: 13px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 26px;
        height: 22px;
        padding: 0 8px;
        border-radius: 999px;
        color: #07111f;
        -webkit-text-fill-color: #07111f;
        background: linear-gradient(180deg,#fff,#ffe2eb);
        font-size: 11px;
        font-weight: 950;
        box-shadow: 0 10px 24px rgba(255,216,229,.18);
      }
      .campus-business-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        min-height: 96px;
        padding: 18px 20px;
        border-radius: 28px;
        color: rgba(245,248,255,.94);
        text-decoration: none;
        overflow: hidden;
        position: relative;
      }
      .campus-business-banner::after {
        content: "";
        position: absolute;
        inset: -70% -10% auto auto;
        width: 260px;
        height: 260px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(143,216,255,.32), transparent 66%);
        pointer-events: none;
      }
      .campus-business-banner h4 {
        margin: 0 0 6px;
        font-size: 1.1rem;
      }
      .campus-business-banner p {
        margin: 0;
        color: rgba(226,238,255,.68);
        line-height: 1.55;
      }
      .campus-business-banner strong {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        text-decoration: none;
        z-index: 1;
      }
      .campus-business-channels {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding: 2px 2px 8px;
        scrollbar-width: none;
      }
      .campus-business-channels::-webkit-scrollbar {
        display: none;
      }
      .campus-business-channel {
        flex: 0 0 auto;
        border: 1px solid rgba(255,255,255,.13);
        border-radius: 999px;
        padding: 10px 15px;
        color: rgba(226,238,255,.72);
        background: rgba(255,255,255,.07);
        font-weight: 850;
        transition: transform .18s ease, border-color .18s ease, background .18s ease;
      }
      .campus-business-channel:hover {
        transform: translateY(-1px);
        border-color: rgba(255,255,255,.24);
        background: rgba(255,255,255,.11);
      }
      .campus-business-channel.is-active {
        color: #07111f !important;
        -webkit-text-fill-color: #07111f;
        background: linear-gradient(180deg,#fff,#d7e5ff 62%,#ffd8e5);
      }
      .campus-business-feed {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .campus-business-feed-card {
        min-height: 150px;
        padding: 16px;
        border-radius: 24px;
        display: grid;
        gap: 10px;
        align-content: space-between;
        color: rgba(245,248,255,.92);
        text-decoration: none;
        position: relative;
        overflow: hidden;
      }
      .campus-business-feed-card b {
        font-size: 1.05rem;
      }
      .campus-business-feed-card p {
        margin: 0;
        color: rgba(226,238,255,.64);
        line-height: 1.55;
      }
      .campus-business-feed-tag {
        width: fit-content;
        border-radius: 999px;
        padding: 7px 10px;
        background: rgba(143,216,255,.12);
        color: rgba(180,231,255,.9);
        font-size: 12px;
        font-weight: 850;
      }
      .campus-business-ai {
        position: fixed;
        right: max(18px, env(safe-area-inset-right));
        bottom: calc(126px + env(safe-area-inset-bottom));
        z-index: 34;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 98px;
        min-height: 54px;
        text-decoration: none;
        box-shadow: 0 18px 52px rgba(143,216,255,.24), 0 8px 18px rgba(0,0,0,.22);
      }
      body:not([data-campus-route="/"]) .campus-business-ai {
        display: none;
      }
      body[data-campus-route="/report"] #root {
        display: none !important;
      }
      .campus-profile-progress-panel {
        margin: 16px 0;
        padding: 20px;
        border-radius: 28px;
        border: 1px solid rgba(255,255,255,.14);
        background:
          radial-gradient(circle at 16% 0%, rgba(143,216,255,.18), transparent 34%),
          linear-gradient(180deg, rgba(255,255,255,.13), rgba(255,255,255,.07));
        box-shadow: 0 18px 46px rgba(0,0,0,.18), inset 0 1px rgba(255,255,255,.14);
        color: rgba(245,248,255,.94);
      }
      .campus-profile-progress-head {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 16px;
        align-items: start;
      }
      .campus-profile-progress-head h3 {
        margin: 0 0 6px;
        font-size: 1.15rem;
      }
      .campus-profile-progress-head p {
        margin: 0;
        color: rgba(226,238,255,.68);
        line-height: 1.62;
      }
      .campus-profile-progress-score {
        width: 74px;
        height: 74px;
        border-radius: 24px;
        display: grid;
        place-items: center;
        color: #07111f;
        background: linear-gradient(180deg,#fff,#d7e5ff 62%,#ffd8e5);
        box-shadow: 0 14px 36px rgba(143,216,255,.18);
        font-size: 22px;
        font-weight: 950;
        font-variant-numeric: tabular-nums;
      }
      .campus-profile-progress-bar {
        height: 10px;
        margin: 18px 0 14px;
        border-radius: 999px;
        overflow: hidden;
        background: rgba(255,255,255,.12);
      }
      .campus-profile-progress-bar span {
        display: block;
        height: 100%;
        width: var(--campus-profile-progress, 0%);
        border-radius: inherit;
        background: linear-gradient(90deg, #8fd8ff, #fff, #ffd8e5);
        box-shadow: 0 0 24px rgba(143,216,255,.36);
      }
      .campus-profile-progress-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 12px;
      }
      .campus-profile-progress-item {
        min-height: 46px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 18px;
        background: rgba(255,255,255,.08);
        color: rgba(226,238,255,.76);
        font-size: 13px;
        font-weight: 800;
      }
      .campus-profile-progress-item::before {
        content: "";
        width: 10px;
        height: 10px;
        flex: 0 0 auto;
        border-radius: 999px;
        background: rgba(226,238,255,.34);
      }
      .campus-profile-progress-item.is-complete {
        color: rgba(245,248,255,.94);
        background: rgba(143,216,255,.13);
      }
      .campus-profile-progress-item.is-complete::before {
        background: #8fd8ff;
        box-shadow: 0 0 18px rgba(143,216,255,.54);
      }
      .campus-activity-center {
        margin: 16px 0;
        padding: 20px;
        border-radius: 28px;
        border: 1px solid rgba(255,255,255,.14);
        background:
          radial-gradient(circle at 82% 4%, rgba(255,216,229,.16), transparent 36%),
          linear-gradient(180deg, rgba(255,255,255,.13), rgba(255,255,255,.07));
        box-shadow: 0 18px 46px rgba(0,0,0,.18), inset 0 1px rgba(255,255,255,.14);
        color: rgba(245,248,255,.94);
      }
      .campus-activity-center-head {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 14px;
      }
      .campus-activity-center-head h3 {
        margin: 0 0 6px;
        font-size: 1.15rem;
      }
      .campus-activity-center-head p {
        margin: 0;
        color: rgba(226,238,255,.68);
        line-height: 1.62;
      }
      .campus-activity-center-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .campus-activity-center-card {
        min-height: 112px;
        padding: 14px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 22px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: space-between;
        color: rgba(245,248,255,.92);
        background: rgba(255,255,255,.08);
        text-align: left;
        text-decoration: none;
      }
      .campus-activity-center-card strong {
        font-size: clamp(1.45rem, 5vw, 2.15rem);
        line-height: 1;
        font-weight: 950;
        font-variant-numeric: tabular-nums;
      }
      .campus-activity-center-card span {
        margin-top: 10px;
        font-size: 13px;
        font-weight: 900;
      }
      .campus-activity-center-card small {
        margin-top: 5px;
        color: rgba(226,238,255,.56);
        line-height: 1.45;
      }
      .campus-activity-center-insights {
        display: grid;
        gap: 8px;
        margin-top: 14px;
      }
      .campus-activity-center-insights span {
        min-height: 36px;
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 8px 11px;
        border-radius: 16px;
        color: rgba(226,238,255,.76);
        background: rgba(255,255,255,.07);
        font-size: 13px;
        line-height: 1.45;
      }
      .campus-activity-center-insights span::before {
        content: "";
        width: 8px;
        height: 8px;
        flex: 0 0 auto;
        border-radius: 999px;
        background: #8fd8ff;
        box-shadow: 0 0 18px rgba(143,216,255,.54);
      }
      .campus-profile-compat-panel {
        margin: 16px 0;
        padding: 20px;
        border-radius: 28px;
        border: 1px solid rgba(255,255,255,.13);
        background:
          radial-gradient(circle at 12% 0%, rgba(143,216,255,.16), transparent 34%),
          linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06));
        box-shadow: 0 18px 46px rgba(0,0,0,.18), inset 0 1px rgba(255,255,255,.14);
        color: rgba(245,248,255,.92);
      }
      .campus-profile-compat-head {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 16px;
      }
      .campus-profile-compat-head h3 {
        margin: 0 0 6px;
        font-size: 1.15rem;
      }
      .campus-profile-compat-head p {
        margin: 0;
        color: rgba(226,238,255,.66);
        line-height: 1.65;
      }
      .campus-profile-compat-form {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 12px;
      }
      .campus-profile-compat-field {
        display: grid;
        gap: 8px;
      }
      .campus-profile-compat-field label {
        color: rgba(226,238,255,.68);
        font-size: 13px;
        font-weight: 850;
      }
      .campus-profile-compat-field select,
      .campus-profile-compat-field input {
        min-height: 52px;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,.15);
        background: rgba(255,255,255,.1);
        color: rgba(255,255,255,.92);
        padding: 0 14px;
        outline: none;
      }
      .campus-profile-compat-field select option {
        color: #07111f;
      }
      .campus-profile-compat-actions {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 4px;
      }
      .campus-profile-compat-actions button,
      .campus-profile-compat-actions a,
      .campus-report-actions a {
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        padding: 0 18px;
        border: 0;
        color: #07111f !important;
        -webkit-text-fill-color: #07111f;
        background: linear-gradient(180deg,#fff,#d7e5ff 62%,#ffd8e5);
        font-weight: 900;
        text-decoration: none;
        cursor: pointer;
      }
      .campus-profile-compat-actions a.secondary,
      .campus-report-actions a.secondary {
        color: rgba(245,248,255,.9) !important;
        -webkit-text-fill-color: rgba(245,248,255,.9);
        border: 1px solid rgba(255,255,255,.16);
        background: rgba(255,255,255,.09);
      }
      .campus-profile-compat-status {
        min-height: 20px;
        color: rgba(226,238,255,.66);
        font-size: 13px;
      }
      .campus-profile-compat-status.is-error {
        color: #ffb4ab;
      }
      .campus-report-page {
        width: min(100% - 28px, 1120px);
        margin: 22px auto 120px;
        display: grid;
        gap: 18px;
        color: rgba(245,248,255,.94);
      }
      .campus-report-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 14px 16px;
        border-radius: 28px;
        border: 1px solid rgba(255,255,255,.13);
        background: rgba(255,255,255,.08);
        backdrop-filter: blur(20px) saturate(1.2);
        -webkit-backdrop-filter: blur(20px) saturate(1.2);
      }
      .campus-report-nav strong {
        font-size: 1rem;
      }
      .campus-report-nav a {
        color: rgba(245,248,255,.86);
        text-decoration: none;
        font-weight: 850;
      }
      .campus-report-hero,
      .campus-report-card,
      .campus-report-tip {
        border: 1px solid rgba(255,255,255,.13);
        background:
          radial-gradient(circle at 18% 0%, rgba(143,216,255,.18), transparent 34%),
          linear-gradient(180deg, rgba(255,255,255,.13), rgba(255,255,255,.06));
        box-shadow: 0 18px 46px rgba(0,0,0,.18), inset 0 1px rgba(255,255,255,.14);
        backdrop-filter: blur(20px) saturate(1.2);
        -webkit-backdrop-filter: blur(20px) saturate(1.2);
      }
      .campus-report-hero {
        min-height: 280px;
        padding: clamp(22px, 4vw, 34px);
        border-radius: 34px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(240px, .72fr);
        gap: 24px;
        align-items: center;
      }
      .campus-report-kicker {
        margin: 0 0 10px;
        color: rgba(226,238,255,.64);
        font-size: 12px;
        font-weight: 950;
        letter-spacing: .12em;
        text-transform: uppercase;
      }
      .campus-report-hero h1 {
        margin: 0;
        font-size: clamp(2.4rem, 6vw, 5.4rem);
        line-height: .95;
        letter-spacing: 0;
      }
      .campus-report-hero p {
        margin: 16px 0 0;
        max-width: 680px;
        color: rgba(226,238,255,.72);
        line-height: 1.75;
      }
      .campus-report-score {
        min-height: 220px;
        border-radius: 30px;
        display: grid;
        place-items: center;
        text-align: center;
        background:
          radial-gradient(circle at 50% 35%, rgba(143,216,255,.24), transparent 38%),
          rgba(255,255,255,.08);
        border: 1px solid rgba(255,255,255,.13);
      }
      .campus-report-score strong {
        font-size: clamp(4.5rem, 10vw, 7rem);
        line-height: .9;
      }
      .campus-report-score span {
        color: rgba(226,238,255,.66);
        font-weight: 850;
      }
      .campus-report-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }
      .campus-report-chip {
        border-radius: 999px;
        padding: 9px 13px;
        border: 1px solid rgba(255,255,255,.13);
        background: rgba(255,255,255,.08);
        color: rgba(245,248,255,.84);
        font-weight: 850;
        font-size: 13px;
      }
      .campus-report-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }
      .campus-report-card,
      .campus-report-tip {
        border-radius: 28px;
        padding: 20px;
      }
      .campus-report-card small,
      .campus-report-tip small {
        color: rgba(226,238,255,.56);
        font-weight: 850;
      }
      .campus-report-card h3,
      .campus-report-tip h3 {
        margin: 10px 0 8px;
        font-size: 1.18rem;
      }
      .campus-report-card p,
      .campus-report-tip p {
        margin: 0;
        color: rgba(226,238,255,.68);
        line-height: 1.65;
      }
      .campus-report-tips {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .campus-report-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      @media (max-width: 720px) {
        .campus-business-home {
          margin-top: 14px;
          gap: 12px;
        }
        .campus-business-home::before {
          inset: -14px -14px -18px;
          border-radius: 30px;
        }
        .campus-business-heading {
          align-items: start;
          flex-direction: column;
          gap: 8px;
        }
        .campus-business-heading h3 {
          font-size: 1.32rem;
        }
        .campus-business-heading p {
          font-size: .92rem;
        }
        .campus-business-live {
          min-height: 30px;
          padding: 0 11px;
        }
        .campus-business-search {
          min-height: 54px;
          padding: 7px 8px 7px 12px;
          border-radius: 22px;
        }
        .campus-business-search span {
          width: 30px;
          height: 30px;
          font-size: 16px;
        }
        .campus-business-search input {
          font-size: 14px;
        }
        .campus-business-search button {
          min-height: 40px;
          padding: 0 14px;
        }
        .campus-business-status {
          grid-template-columns: 1fr;
          gap: 10px;
        }
        .campus-business-score {
          min-height: 146px;
          padding: 16px;
          border-radius: 24px;
        }
        .campus-business-score::after {
          width: 72px;
          height: 72px;
          right: 16px;
          top: 18px;
        }
        .campus-business-score strong {
          font-size: 3.4rem;
        }
        .campus-business-score p {
          max-width: 270px;
          font-size: .9rem;
          line-height: 1.6;
        }
        .campus-business-metrics {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          padding: 8px;
          gap: 8px;
          border-radius: 22px;
        }
        .campus-business-meter {
          min-height: 96px;
          padding: 8px 4px;
          border-radius: 16px;
        }
        .campus-business-meter i {
          height: 40px;
          width: 10px;
        }
        .campus-business-meter b {
          font-size: .98rem;
        }
        .campus-business-meter span {
          font-size: 11px;
        }
        .campus-business-shortcuts {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        .campus-business-shortcut {
          min-height: 94px;
          border-radius: 20px;
          padding: 10px 9px;
          align-content: center;
          justify-items: start;
          gap: 7px;
        }
        .campus-business-icon {
          width: 34px;
          height: 34px;
          border-radius: 13px;
          font-size: 12px;
        }
        .campus-business-shortcut b {
          font-size: .88rem;
          line-height: 1.15;
        }
        .campus-business-shortcut small {
          display: none;
        }
        .campus-business-badge {
          top: 9px;
          right: 8px;
          min-width: 22px;
          height: 18px;
          padding: 0 6px;
          font-size: 10px;
        }
        .campus-business-banner {
          align-items: start;
          flex-direction: column;
          min-height: 118px;
          padding: 15px;
          border-radius: 24px;
          gap: 13px;
        }
        .campus-business-banner h4 {
          font-size: 1.02rem;
        }
        .campus-business-banner p {
          font-size: .92rem;
          line-height: 1.5;
        }
        .campus-business-banner strong {
          width: 100%;
        }
        .campus-business-channel {
          padding: 9px 13px;
          font-size: 13px;
        }
        .campus-business-feed {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 1px 2px 8px;
          margin-left: -2px;
          margin-right: -2px;
          scrollbar-width: none;
        }
        .campus-business-feed::-webkit-scrollbar {
          display: none;
        }
        .campus-business-feed-card {
          flex: 0 0 min(82vw, 312px);
          scroll-snap-align: start;
          min-height: 136px;
          border-radius: 22px;
        }
        .campus-business-feed-card p {
          font-size: .93rem;
          line-height: 1.5;
        }
        .campus-business-ai {
          position: static;
          justify-self: end;
          margin-top: -4px;
          min-width: 86px;
          min-height: 46px;
          font-size: 14px;
        }
        .campus-profile-progress-panel {
          padding: 16px;
          border-radius: 24px;
        }
        .campus-profile-progress-head {
          grid-template-columns: 1fr;
        }
        .campus-profile-progress-score {
          width: 100%;
          height: 50px;
          border-radius: 18px;
        }
        .campus-profile-progress-list {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .campus-profile-progress-item {
          min-height: 40px;
          padding: 8px 10px;
          font-size: 12px;
        }
        .campus-activity-center {
          padding: 16px;
          border-radius: 24px;
        }
        .campus-activity-center-head {
          display: block;
        }
        .campus-activity-center-grid {
          grid-template-columns: 1fr;
        }
        .campus-activity-center-card {
          min-height: 86px;
        }
        .campus-activity-modal {
          align-items: end;
          padding: 0;
        }
        .campus-activity-dialog {
          width: 100%;
          max-height: min(86vh, 760px);
          border-radius: 28px 28px 0 0;
        }
        .campus-activity-head,
        .campus-activity-body {
          padding-left: 16px;
          padding-right: 16px;
        }
        .campus-activity-card {
          grid-template-columns: 50px minmax(0, 1fr);
        }
        .campus-activity-actions,
        .campus-activity-action {
          grid-column: 2;
          justify-self: start;
        }
        .campus-activity-actions {
          justify-content: flex-start;
        }
        .campus-profile-compat-panel {
          padding: 16px;
          border-radius: 24px;
        }
        .campus-profile-compat-head {
          display: grid;
          gap: 10px;
        }
        .campus-profile-compat-form {
          grid-template-columns: 1fr;
        }
        .campus-profile-compat-actions {
          display: grid;
          grid-template-columns: 1fr;
        }
        .campus-report-page {
          width: min(100% - 28px, 430px);
          margin-top: 14px;
          gap: 14px;
        }
        .campus-report-hero {
          grid-template-columns: 1fr;
          min-height: auto;
          padding: 20px;
          border-radius: 28px;
        }
        .campus-report-score {
          min-height: 158px;
          border-radius: 24px;
        }
        .campus-report-grid,
        .campus-report-tips {
          grid-template-columns: 1fr;
          gap: 10px;
        }
        .campus-report-card,
        .campus-report-tip {
          border-radius: 24px;
          padding: 16px;
        }
        .campus-report-actions {
          display: grid;
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 380px) {
        .campus-business-shortcut {
          min-height: 88px;
          padding: 9px 8px;
        }
        .campus-business-shortcut b {
          font-size: .82rem;
        }
        .campus-business-icon {
          width: 31px;
          height: 31px;
          border-radius: 12px;
        }
        .campus-business-search input {
          font-size: 13px;
        }
        .campus-business-search button {
          min-height: 38px;
          padding: 0 12px;
        }
      }

      @media (min-width: 721px) and (max-width: 1180px) {
        .campus-business-shortcuts {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .campus-business-feed {
          grid-template-columns: 1fr;
          gap: 10px;
        }
        .campus-business-feed-card {
          min-height: 126px;
          border-radius: 22px;
        }
      }

      @media (max-width: 900px) {
        .campus-login-hero,
        .campus-login-grid,
        .campus-membership-grid {
          grid-template-columns: 1fr;
        }
        .campus-privacy-actions,
        .campus-privacy-actions.has-cancel {
          grid-template-columns: 1fr;
        }
        .campus-login-visual {
          min-height: 48vh;
        }
        .campus-login-strip {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 640px) {
        html,
        body {
          overflow-x: hidden;
        }
        .liquid-orb {
          display: none !important;
        }
        .campus-login-story {
          min-height: 220vh;
        }
        .campus-login-hero,
        .campus-login-band,
        .campus-login-bottom {
          width: min(100% - 20px, 420px);
        }
        .campus-login-hero {
          min-height: auto;
          padding: 22px 0 34px;
          gap: 18px;
          align-items: start;
        }
        .campus-login-hero-copy {
          gap: 14px;
        }
        .campus-login-kicker {
          font-size: 11px;
          letter-spacing: .12em;
        }
        .campus-login-hero h1 {
          font-size: 2.16rem;
          line-height: 1.08;
          max-width: 100%;
          word-break: normal;
          overflow-wrap: anywhere;
        }
        .campus-login-hero p,
        .campus-login-bottom p {
          font-size: .95rem;
          line-height: 1.72;
        }
        .campus-login-actions {
          gap: 10px;
        }
        .campus-login-actions .campus-login-open {
          min-height: 44px;
          padding: 0 18px;
        }
        .campus-login-secondary {
          font-size: .92rem;
        }
        .campus-login-visual {
          width: 100%;
          min-height: 44vh;
          border-radius: 26px;
        }
        .campus-login-visual-copy {
          left: 18px;
          right: 18px;
          bottom: 18px;
        }
        .campus-login-strip {
          padding: 14px;
          border-radius: 22px;
          gap: 12px;
        }
        .campus-login-strip strong {
          font-size: 1.08rem;
        }
        .campus-story-carousel {
          margin-left: -2px;
          margin-right: -2px;
          padding-bottom: 34px;
        }
        .campus-story-carousel:not(.swiper-initialized) .swiper-slide {
          flex-basis: min(82vw, 320px);
        }
        .campus-login-card,
        .campus-plan-card {
          border-radius: 22px;
          padding: 18px;
        }
        .campus-login-card h3,
        .campus-plan-card h3,
        .campus-membership-current h3 {
          font-size: 1.08rem;
        }
        .campus-plan-price strong {
          font-size: 1.7rem;
        }
        .campus-plan-features {
          gap: 6px;
        }
        .campus-login-bottom {
          min-height: 58vh;
          padding-bottom: 18vh;
        }
        .campus-login-bottom h2 {
          font-size: 2.2rem;
          line-height: 1.06;
        }
        body[data-campus-route="/login"] #root > div {
          padding: 12px;
          align-items: end;
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md {
          width: min(100%, 390px);
          max-width: min(100%, 390px);
          max-height: calc(100vh - 24px);
          border-radius: 28px !important;
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md .text-center.mb-8 {
          margin-bottom: 14px !important;
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md .w-28.h-28 {
          width: 64px !important;
          height: 64px !important;
          margin-bottom: 12px !important;
        }
        .campus-quick-actions {
          display: none !important;
        }
        .campus-code-panel { grid-template-columns: 1fr; }
        .campus-code-panel button,
        .campus-code-panel input {
          min-height: 44px;
        }
        .campus-membership-head,
        .campus-membership-body,
        .campus-membership-dialog {
          padding-left: 16px;
          padding-right: 16px;
        }
        .campus-membership-dialog {
          max-height: calc(100vh - 18px);
          border-radius: 28px;
        }
        .campus-membership-body { padding-bottom: 16px; }
        .campus-plan-actions { grid-template-columns: 1fr; }
        .campus-membership-banner {
          margin: 12px 0;
          padding: 16px;
          border-radius: 24px;
        }
        .campus-membership-banner .campus-membership-button {
          width: 100%;
        }
        .campus-privacy-panel {
          padding: 16px;
          border-radius: 24px;
        }
        .campus-privacy-actions {
          grid-template-columns: 1fr;
        }
        .ios-tabbar-wrap {
          padding-left: 14px !important;
          padding-right: 14px !important;
          padding-bottom: 8px !important;
        }
        .ios-tabbar {
          border-radius: 28px !important;
          padding: 6px !important;
        }
        .ios-tab-item {
          min-width: 62px !important;
          padding: 8px 9px !important;
        }
        body[data-campus-route="/"] main,
        body[data-campus-route="/profile"] main {
          padding-bottom: 132px !important;
        }
        body[data-campus-route="/"] [class*="max-w-6xl"],
        body[data-campus-route="/profile"] [class*="space-y-6"][class*="relative"] {
          padding-left: 14px !important;
          padding-right: 14px !important;
        }
        body[data-campus-route="/"] .campus-home-header {
          padding: 14px !important;
          gap: 12px !important;
          border-radius: 28px !important;
        }
        body[data-campus-route="/"] .campus-home-header h1 {
          font-size: 1.05rem !important;
          line-height: 1.2 !important;
        }
        body[data-campus-route="/"] .campus-home-header p {
          display: none;
        }
        body[data-campus-route="/"] .campus-home-header .mini-button {
          min-width: 112px;
          min-height: 48px !important;
          padding: 0 15px !important;
          white-space: nowrap;
        }
        body[data-campus-route="/"] .campus-home-hero-card {
          min-height: auto !important;
          padding: 24px 22px !important;
          border-radius: 28px !important;
        }
        body[data-campus-route="/"] .campus-home-hero-card h2 {
          max-width: 100% !important;
          font-size: 2rem !important;
          line-height: 1.06 !important;
          letter-spacing: 0px !important;
          overflow-wrap: anywhere;
        }
        body[data-campus-route="/"] .campus-home-hero-card [class*="tracking-"],
        body[data-campus-route="/profile"] [class*="tracking-"] {
          letter-spacing: 0px !important;
        }
        body[data-campus-route="/"] .campus-home-hero-card p {
          font-size: .96rem !important;
          line-height: 1.72 !important;
        }
        body[data-campus-route="/"] .campus-home-hero-card .apple-btn,
        body[data-campus-route="/"] .campus-home-hero-card .apple-btn-secondary {
          min-height: 48px !important;
          padding: 0 18px !important;
        }
        body[data-campus-route="/"] .campus-home-hero-card .liquid-glass {
          padding: 16px !important;
          border-radius: 24px !important;
        }
        body[data-campus-route="/"] .campus-home-hero-card [class*="gap-6"] {
          gap: 18px !important;
          flex-wrap: wrap !important;
        }
        body[data-campus-route="/profile"] .campus-profile-summary-card,
        body[data-campus-route="/profile"] .campus-profile-form-card {
          width: 100%;
          border-radius: 28px !important;
        }
        body[data-campus-route="/profile"] .campus-profile-summary-card {
          padding: 22px 20px 20px !important;
        }
        body[data-campus-route="/profile"] .campus-profile-summary-card > div:first-child {
          display: grid !important;
          grid-template-columns: 82px minmax(0, 1fr);
          gap: 14px !important;
        }
        body[data-campus-route="/profile"] .campus-profile-summary-card [class*="w-24"][class*="h-24"] {
          width: 82px !important;
          height: 82px !important;
          border-radius: 1.6rem !important;
        }
        body[data-campus-route="/profile"] .campus-avatar-control > .campus-avatar-upload-trigger {
          top: 50px !important;
        }
        body[data-campus-route="/profile"] .campus-avatar-upload-status {
          max-width: 96px;
          font-size: 10px;
        }
        body[data-campus-route="/profile"] .campus-profile-summary-card [class*="rounded-[1.5rem]"] {
          border-radius: 1.2rem !important;
        }
        body[data-campus-route="/profile"] .campus-profile-summary-card .ios-nav-btn {
          position: absolute;
          top: 22px;
          right: 20px;
          width: 38px;
          height: 38px;
        }
        body[data-campus-route="/profile"] .campus-profile-summary-card h1 {
          padding-right: 44px;
          font-size: 1.42rem !important;
          line-height: 1.16 !important;
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
        }
        body[data-campus-route="/profile"] .campus-profile-summary-card p.truncate,
        body[data-campus-route="/profile"] .campus-profile-summary-card .truncate {
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: clip !important;
          line-height: 1.35 !important;
        }
        body[data-campus-route="/profile"] .campus-profile-summary-card [class*="grid-cols-3"] {
          gap: 10px !important;
          margin-top: 18px !important;
        }
        body[data-campus-route="/profile"] .campus-profile-summary-card [class*="grid-cols-3"] > * {
          min-width: 0;
          padding: 12px 6px !important;
          border-radius: 20px !important;
        }
        body[data-campus-route="/profile"] .campus-profile-form-card {
          padding: 22px 20px !important;
        }
        body[data-campus-route="/profile"] .campus-profile-form-card [class*="grid-cols"] {
          grid-template-columns: 1fr !important;
        }
        body[data-campus-route="/profile"] .campus-profile-form-card input,
        body[data-campus-route="/profile"] .campus-profile-form-card textarea {
          min-height: 56px;
          border-radius: 1.2rem !important;
          padding-left: 18px !important;
          padding-right: 18px !important;
          font-size: 16px !important;
          color: rgba(255,255,255,.9) !important;
          -webkit-text-fill-color: rgba(255,255,255,.9);
          background: rgba(255,255,255,.13) !important;
          opacity: 1 !important;
        }
        body[data-campus-route="/profile"] .campus-profile-form-card textarea {
          min-height: 92px;
          padding-top: 16px !important;
        }
        body[data-campus-route="/profile"] [class*="text-ios-gray-900"],
        body[data-campus-route="/profile"] [class*="text-ios-gray-800"],
        body[data-campus-route="/profile"] [class*="text-ios-gray-700"] {
          color: rgba(255,255,255,.94) !important;
        }
        body[data-campus-route="/profile"] [class*="text-ios-gray-600"],
        body[data-campus-route="/profile"] [class*="text-ios-gray-500"],
        body[data-campus-route="/profile"] [class*="text-ios-gray-400"] {
          color: rgba(226,238,255,.72) !important;
        }
        body[data-campus-route="/profile"] .campus-profile-form-card input::placeholder,
        body[data-campus-route="/profile"] .campus-profile-form-card textarea::placeholder {
          color: rgba(226,238,255,.46) !important;
        }
        @media (max-width: 380px) {
          body[data-campus-route="/"] .campus-home-hero-card h2 {
            font-size: 1.9rem !important;
          }
          body[data-campus-route="/profile"] .campus-profile-summary-card > div:first-child {
            grid-template-columns: 74px minmax(0, 1fr);
          }
          body[data-campus-route="/profile"] .campus-profile-summary-card [class*="w-24"][class*="h-24"] {
            width: 74px !important;
            height: 74px !important;
          }
        }
      }

      body[data-campus-route="/login"] {
        --campus-ios-ink: #0b1220;
        --campus-ios-muted: #536174;
        --campus-ios-blue: #007aff;
        --campus-login-shift: 0px;
        background:
          radial-gradient(circle at 13% 14%, rgba(90, 200, 250, .40), transparent 32vw),
          radial-gradient(circle at 88% 10%, rgba(255, 159, 206, .34), transparent 28vw),
          linear-gradient(145deg, #f6fbff 0%, #eef7ff 45%, #fff6fb 100%) !important;
      }
      body[data-campus-route="/login"]::before,
      body[data-campus-route="/login"]::after {
        content: "";
        position: fixed;
        z-index: 0;
        pointer-events: none;
        border-radius: 999px;
        filter: blur(56px);
        opacity: .72;
        transform: translate3d(0, var(--campus-login-shift), 0);
      }
      body[data-campus-route="/login"]::before {
        width: 340px;
        height: 340px;
        left: -120px;
        top: 92px;
        background: rgba(90, 200, 250, .38);
        animation: campus-ios-drift 8s ease-in-out infinite alternate;
      }
      body[data-campus-route="/login"]::after {
        width: 320px;
        height: 320px;
        right: -110px;
        top: 42px;
        background: rgba(191, 144, 255, .28);
        animation: campus-ios-drift 9s ease-in-out infinite alternate-reverse;
      }
      body[data-campus-route="/login"] #root,
      body[data-campus-route="/login"] .campus-login-story {
        position: relative;
        z-index: 1;
      }
      body[data-campus-route="/login"] .campus-login-story {
        color: var(--campus-ios-ink);
      }
      body[data-campus-route="/login"] .campus-login-hero,
      body[data-campus-route="/login"] .campus-login-band,
      body[data-campus-route="/login"] .campus-login-bottom {
        position: relative;
      }
      body[data-campus-route="/login"] .campus-login-kicker {
        color: rgba(0, 122, 255, .78);
        font-weight: 800;
      }
      body[data-campus-route="/login"] .campus-login-hero h1,
      body[data-campus-route="/login"] .campus-login-bottom h2 {
        color: var(--campus-ios-ink);
        text-wrap: balance;
      }
      body[data-campus-route="/login"] .campus-login-hero h1 {
        max-width: 660px;
        font-size: clamp(2.8rem, 4.6vw, 4rem);
        line-height: 1.08;
      }
      body[data-campus-route="/login"] .campus-login-hero p,
      body[data-campus-route="/login"] .campus-login-bottom p,
      body[data-campus-route="/login"] .campus-login-secondary {
        color: var(--campus-ios-muted);
      }
      body[data-campus-route="/login"] .campus-login-open {
        min-height: 52px;
        padding: 0 22px;
        color: #fff;
        background: rgba(11, 18, 32, .92);
        border: 1px solid rgba(255, 255, 255, .72);
        box-shadow: 0 18px 44px rgba(11, 18, 32, .18), inset 0 1px rgba(255, 255, 255, .25);
        transition: transform .22s cubic-bezier(.2, 1, .22, 1), box-shadow .22s ease, background .22s ease;
      }
      body[data-campus-route="/login"] .campus-login-open:hover {
        transform: translateY(-2px) scale(1.015);
        box-shadow: 0 24px 54px rgba(11, 18, 32, .22), inset 0 1px rgba(255, 255, 255, .3);
      }
      body[data-campus-route="/login"] .campus-login-open:active {
        transform: translateY(1px) scale(.985);
      }
      body[data-campus-route="/login"] .campus-login-visual {
        min-height: 68vh;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, .18), rgba(255, 255, 255, .02)),
          linear-gradient(135deg, rgba(90, 200, 250, .58), rgba(175, 82, 222, .50) 54%, rgba(255, 159, 10, .30)),
          url("/dingfang-example.jpg") center/cover no-repeat;
        border: 1px solid rgba(255, 255, 255, .62);
        border-radius: 36px;
        box-shadow: 0 34px 90px rgba(31, 55, 90, .22), inset 0 1px rgba(255, 255, 255, .62);
        transform: perspective(900px) rotateX(var(--campus-tilt-y, 0deg)) rotateY(var(--campus-tilt-x, 0deg)) translate3d(0, var(--campus-login-visual-shift, 0px), 0);
        transform-style: preserve-3d;
        transition: transform .28s cubic-bezier(.16, 1, .3, 1), box-shadow .28s ease;
        will-change: transform;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }
      body[data-campus-route="/login"] .campus-login-visual::after {
        background:
          radial-gradient(circle at 24% 20%, rgba(255,255,255,.50), transparent 21%),
          linear-gradient(180deg, rgba(255,255,255,.12), transparent 42%, rgba(13, 24, 42, .44));
      }
      body[data-campus-route="/login"] .campus-login-visual-copy {
        left: 20px;
        right: 20px;
        bottom: 20px;
        z-index: 2;
        padding: 18px;
        border: 1px solid rgba(255,255,255,.58);
        border-radius: 26px;
        color: #0b1220;
        background: rgba(255,255,255,.56);
        backdrop-filter: blur(24px) saturate(1.24);
        -webkit-backdrop-filter: blur(24px) saturate(1.24);
        box-shadow: 0 18px 46px rgba(31,55,90,.16), inset 0 1px rgba(255,255,255,.72);
      }
      body[data-campus-route="/login"] .campus-login-visual-copy strong {
        color: #0b1220;
      }
      body[data-campus-route="/login"] .campus-login-visual-copy p {
        color: rgba(83,97,116,.92);
      }
      .campus-ios-preview {
        position: absolute;
        inset: 28px 24px auto;
        z-index: 2;
        display: grid;
        gap: 14px;
        max-width: 360px;
        transform: translateZ(50px);
      }
      .campus-ios-preview-card {
        border: 1px solid rgba(255,255,255,.58);
        border-radius: 28px;
        padding: 18px;
        color: #0b1220;
        background: rgba(255,255,255,.56);
        backdrop-filter: blur(28px) saturate(1.36);
        -webkit-backdrop-filter: blur(28px) saturate(1.36);
        box-shadow: 0 20px 46px rgba(31,55,90,.18), inset 0 1px rgba(255,255,255,.74);
        animation: campus-ios-float 5.4s ease-in-out infinite;
      }
      .campus-ios-preview-card:nth-child(2) {
        width: 78%;
        justify-self: end;
        animation-delay: -1.8s;
      }
      .campus-ios-preview-card strong {
        display: block;
        margin-bottom: 6px;
        font-size: 1rem;
      }
      .campus-ios-preview-card span {
        display: block;
        color: rgba(83,97,116,.92);
        font-size: .88rem;
        line-height: 1.55;
      }
      .campus-ios-metric-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-top: 12px;
      }
      .campus-ios-metric {
        border-radius: 18px;
        padding: 10px;
        background: rgba(255,255,255,.46);
        text-align: center;
      }
      .campus-ios-metric b,
      .campus-ios-metric small {
        display: block;
      }
      .campus-ios-metric b {
        color: #007aff;
        font-size: 1.15rem;
      }
      .campus-ios-metric small {
        color: rgba(83,97,116,.86);
        font-size: .72rem;
      }
      body[data-campus-route="/login"] .campus-login-strip,
      body[data-campus-route="/login"] .campus-login-card,
      body[data-campus-route="/login"] .campus-plan-card {
        color: var(--campus-ios-ink);
        border: 1px solid rgba(255,255,255,.68);
        background: rgba(255,255,255,.48);
        backdrop-filter: blur(28px) saturate(1.28);
        -webkit-backdrop-filter: blur(28px) saturate(1.28);
        box-shadow: 0 24px 68px rgba(31,55,90,.16), inset 0 1px rgba(255,255,255,.72);
      }
      body[data-campus-route="/login"] .campus-login-strip span,
      body[data-campus-route="/login"] .campus-login-card p,
      body[data-campus-route="/login"] .campus-plan-card p,
      body[data-campus-route="/login"] .campus-plan-card li,
      body[data-campus-route="/login"] .campus-plan-price span {
        color: rgba(83,97,116,.92);
      }
      body[data-campus-route="/login"] .campus-story-carousel .swiper-pagination-bullet {
        background: rgba(11,18,32,.18);
      }
      body[data-campus-route="/login"] .campus-story-carousel .swiper-pagination-bullet-active {
        background: #007aff;
      }
      body[data-campus-route="/login"] #root > div {
        background: rgba(244, 248, 255, 0);
        transition: opacity .28s ease, background .28s ease, backdrop-filter .28s ease;
        will-change: opacity, background, backdrop-filter;
      }
      body[data-campus-route="/login"] #root > div > .w-full.max-w-md {
        position: relative;
        border: 1px solid rgba(255,255,255,.78) !important;
        border-radius: 36px !important;
        background: rgba(255,255,255,.66) !important;
        backdrop-filter: blur(34px) saturate(1.32);
        -webkit-backdrop-filter: blur(34px) saturate(1.32);
        box-shadow: 0 34px 96px rgba(31,55,90,.24), inset 0 1px rgba(255,255,255,.78) !important;
        transform: translate3d(0, 104px, 0) scale(.96);
        opacity: .6;
        transition: transform .44s cubic-bezier(.16, 1, .3, 1), opacity .24s ease;
        will-change: transform, opacity;
        contain: paint;
        overscroll-behavior: contain;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }
      body[data-campus-route="/login"] #root > div > .w-full.max-w-md::before {
        content: "";
        position: absolute;
        left: 50%;
        top: 13px;
        width: 72px;
        height: 5px;
        border-radius: 999px;
        background: rgba(11,18,32,.18);
        transform: translateX(-50%);
      }
      body[data-campus-route="/login"][data-campus-login-overlay="open"] #root > div {
        background: rgba(246, 250, 255, .48);
        backdrop-filter: blur(18px) saturate(1.18);
        -webkit-backdrop-filter: blur(18px) saturate(1.18);
      }
      body[data-campus-route="/login"][data-campus-login-overlay="open"] #root > div > .w-full.max-w-md {
        transform: translate3d(0, 0, 0) scale(1);
        opacity: 1;
      }
      body[data-campus-route="/login"] #root > div > .w-full.max-w-md input {
        min-height: 56px;
        border-radius: 22px !important;
        border: 1px solid rgba(255,255,255,.72) !important;
        background: rgba(255,255,255,.44) !important;
        color: #0b1220 !important;
        -webkit-text-fill-color: #0b1220;
        box-shadow: inset 0 1px rgba(255,255,255,.56);
      }
      body[data-campus-route="/login"] #root > div > .w-full.max-w-md input::placeholder {
        color: rgba(83,97,116,.68) !important;
        -webkit-text-fill-color: rgba(83,97,116,.68);
      }
      body[data-campus-route="/login"] #root > div > .w-full.max-w-md button[type="submit"],
      body[data-campus-route="/login"] #campus-send-code {
        border-radius: 999px !important;
        transition: transform .16s cubic-bezier(.16, 1, .3, 1), filter .18s ease;
      }
      body[data-campus-route="/login"] #root > div > .w-full.max-w-md button[type="submit"]:active,
      body[data-campus-route="/login"] #campus-send-code:active {
        transform: scale(.985);
      }
      body[data-campus-route="/login"] .campus-code-panel input {
        background: rgba(255,255,255,.44) !important;
        color: #0b1220 !important;
        -webkit-text-fill-color: #0b1220;
        border-color: rgba(255,255,255,.72) !important;
      }
      body[data-campus-route="/login"] .campus-code-panel input::placeholder {
        color: rgba(83,97,116,.68);
        -webkit-text-fill-color: rgba(83,97,116,.68);
      }
      body[data-campus-route="/login"] .campus-code-message {
        color: rgba(83,97,116,.86);
      }
      @keyframes campus-ios-float {
        0%, 100% { transform: translate3d(0, 0, 0); }
        50% { transform: translate3d(0, -10px, 0); }
      }
      @keyframes campus-ios-drift {
        0% { transform: translate3d(-8px, var(--campus-login-shift), 0) scale(1); }
        100% { transform: translate3d(14px, calc(var(--campus-login-shift) + 22px), 0) scale(1.06); }
      }
      @media (max-width: 640px) {
        body[data-campus-route="/login"] .campus-login-story {
          min-height: 228vh;
        }
        body[data-campus-route="/login"] .campus-login-hero {
          min-height: 92vh;
          padding-top: 20px;
        }
        body[data-campus-route="/login"] .campus-login-hero h1 {
          font-size: 2.16rem;
          line-height: 1.08;
        }
        body[data-campus-route="/login"] .campus-login-visual {
          min-height: 56vh;
          border-radius: 32px;
        }
        .campus-ios-preview {
          inset: 18px 16px auto;
          gap: 10px;
        }
        .campus-ios-preview-card {
          border-radius: 24px;
          padding: 14px;
        }
        .campus-ios-preview-card:nth-child(2) {
          width: 84%;
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md {
          border-radius: 34px !important;
          max-height: calc(100vh - 18px);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        body[data-campus-route="/login"]::before,
        body[data-campus-route="/login"]::after,
        .campus-ios-preview-card {
          animation: none !important;
        }
        body[data-campus-route="/login"] .campus-login-visual,
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md,
        body[data-campus-route="/login"] .campus-login-open {
          transition-duration: .18s !important;
        }
      }

      #campus-spline-stage {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        overflow: hidden;
        opacity: 0;
        background:
          linear-gradient(135deg, #050711 0%, #0a1024 36%, #171126 68%, #07121e 100%);
        transition: opacity .45s ease;
      }
      #campus-spline-stage.is-active {
        opacity: 1;
      }
      #campus-spline-canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
      .campus-spline-fallback::before {
        content: "";
        position: absolute;
        inset: 0;
        background:
          conic-gradient(from 210deg at 62% 46%, rgba(99,191,255,.35), rgba(195,126,255,.28), rgba(255,156,204,.26), rgba(99,191,255,.35)),
          linear-gradient(135deg, #050711, #0d152c 50%, #171126);
      }
      body[data-campus-spline="active"] {
        background: #050711 !important;
      }
      body[data-campus-spline="active"]::before,
      body[data-campus-spline="active"]::after {
        display: none !important;
      }
      body[data-campus-spline="active"] #root,
      body[data-campus-spline="active"] .campus-login-story {
        position: relative;
        z-index: 2;
      }
      body[data-campus-spline="active"] .liquid-orb {
        display: none !important;
      }
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-story {
        color: rgba(255,255,255,.92);
      }
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-kicker {
        color: rgba(133,213,255,.92);
      }
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-hero h1,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-bottom h2 {
        color: rgba(255,255,255,.96);
        text-shadow: 0 24px 90px rgba(109,196,255,.24);
      }
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-hero p,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-bottom p,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-secondary {
        color: rgba(224,238,255,.78);
      }
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-open {
        color: #04111f;
        background: linear-gradient(135deg, rgba(255,255,255,.96), rgba(142,220,255,.9) 52%, rgba(255,174,217,.92));
        box-shadow: 0 24px 70px rgba(93,185,255,.28), inset 0 1px rgba(255,255,255,.82);
      }
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-visual {
        background:
          linear-gradient(145deg, rgba(255,255,255,.12), rgba(255,255,255,.04)),
          linear-gradient(180deg, rgba(95,180,255,.12), rgba(255,135,205,.10));
        border-color: rgba(255,255,255,.24);
        box-shadow: 0 34px 110px rgba(0,0,0,.36), inset 0 1px rgba(255,255,255,.28);
        backdrop-filter: blur(20px) saturate(1.25);
        -webkit-backdrop-filter: blur(20px) saturate(1.25);
      }
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-visual::after {
        background:
          linear-gradient(180deg, rgba(255,255,255,.08), transparent 42%, rgba(2,7,16,.18)),
          linear-gradient(90deg, rgba(90,200,250,.16), transparent 34%, rgba(255,159,206,.14));
      }
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-ios-preview-card,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-visual-copy,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-strip,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-card,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-plan-card {
        color: rgba(255,255,255,.94);
        border-color: rgba(255,255,255,.22);
        background: rgba(10, 18, 36, .48);
        backdrop-filter: blur(28px) saturate(1.35);
        -webkit-backdrop-filter: blur(28px) saturate(1.35);
        box-shadow: 0 26px 80px rgba(0,0,0,.24), inset 0 1px rgba(255,255,255,.22);
      }
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-ios-preview-card strong,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-visual-copy strong,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-card h3,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-plan-card h3,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-strip strong {
        color: rgba(255,255,255,.96);
      }
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-ios-preview-card span,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-visual-copy p,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-strip span,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-login-card p,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-plan-card p,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-plan-card li,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-plan-price span {
        color: rgba(224,238,255,.74);
      }
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-ios-metric {
        background: rgba(255,255,255,.12);
      }
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-ios-metric small {
        color: rgba(224,238,255,.82);
      }
      body[data-campus-spline="active"][data-campus-route="/login"] #root > div > .w-full.max-w-md {
        color: rgba(255,255,255,.94);
        border-color: rgba(255,255,255,.24) !important;
        background: rgba(9, 16, 32, .72) !important;
        box-shadow: 0 38px 110px rgba(0,0,0,.42), inset 0 1px rgba(255,255,255,.26) !important;
      }
      body[data-campus-spline="active"][data-campus-route="/login"] #root > div > .w-full.max-w-md h1,
      body[data-campus-spline="active"][data-campus-route="/login"] #root > div > .w-full.max-w-md label,
      body[data-campus-spline="active"][data-campus-route="/login"] #root > div > .w-full.max-w-md [class*="text-ios-gray-900"],
      body[data-campus-spline="active"][data-campus-route="/login"] #root > div > .w-full.max-w-md [class*="text-ios-gray-800"],
      body[data-campus-spline="active"][data-campus-route="/login"] #root > div > .w-full.max-w-md [class*="text-ios-gray-700"] {
        color: rgba(255,255,255,.96) !important;
      }
      body[data-campus-spline="active"][data-campus-route="/login"] #root > div > .w-full.max-w-md p,
      body[data-campus-spline="active"][data-campus-route="/login"] #root > div > .w-full.max-w-md span,
      body[data-campus-spline="active"][data-campus-route="/login"] #root > div > .w-full.max-w-md [class*="text-ios-gray-600"],
      body[data-campus-spline="active"][data-campus-route="/login"] #root > div > .w-full.max-w-md [class*="text-ios-gray-500"],
      body[data-campus-spline="active"][data-campus-route="/login"] #root > div > .w-full.max-w-md [class*="text-ios-gray-400"] {
        color: rgba(224,238,255,.78) !important;
      }
      body[data-campus-spline="active"][data-campus-route="/login"] #root > div > .w-full.max-w-md input,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-code-panel input {
        color: rgba(255,255,255,.96) !important;
        -webkit-text-fill-color: rgba(255,255,255,.96);
        border-color: rgba(255,255,255,.18) !important;
        background: rgba(255,255,255,.08) !important;
      }
      body[data-campus-spline="active"][data-campus-route="/login"] #root > div > .w-full.max-w-md input::placeholder,
      body[data-campus-spline="active"][data-campus-route="/login"] .campus-code-panel input::placeholder {
        color: rgba(224,238,255,.58) !important;
        -webkit-text-fill-color: rgba(224,238,255,.58);
      }
      body[data-campus-spline="active"][data-campus-route="/"] main {
        position: relative;
        z-index: 2;
      }
      body[data-campus-spline="active"][data-campus-route="/"] .campus-home-header,
      body[data-campus-spline="active"][data-campus-route="/"] .campus-home-hero-card,
      body[data-campus-spline="active"][data-campus-route="/"] .apple-card,
      body[data-campus-spline="active"][data-campus-route="/"] .liquid-glass {
        border-color: rgba(255,255,255,.20) !important;
        background: rgba(9, 16, 32, .48) !important;
        backdrop-filter: blur(28px) saturate(1.36) !important;
        -webkit-backdrop-filter: blur(28px) saturate(1.36) !important;
        box-shadow: 0 26px 90px rgba(0,0,0,.28), inset 0 1px rgba(255,255,255,.20) !important;
      }
      body[data-campus-spline="active"][data-campus-route="/"] h1,
      body[data-campus-spline="active"][data-campus-route="/"] h2,
      body[data-campus-spline="active"][data-campus-route="/"] h3,
      body[data-campus-spline="active"][data-campus-route="/"] [class*="text-ios-gray-900"],
      body[data-campus-spline="active"][data-campus-route="/"] [class*="text-ios-gray-800"],
      body[data-campus-spline="active"][data-campus-route="/"] [class*="text-ios-gray-700"] {
        color: rgba(255,255,255,.96) !important;
      }
      body[data-campus-spline="active"][data-campus-route="/"] h1 {
        line-height: 1.02 !important;
        text-wrap: balance;
      }
      body[data-campus-spline="active"][data-campus-route="/"] .campus-home-hero-card h2 {
        max-width: 10ch !important;
        font-size: clamp(2.35rem, 4.6vw, 4.45rem) !important;
        line-height: 1.04 !important;
        letter-spacing: 0 !important;
        text-wrap: balance;
      }
      body[data-campus-spline="active"][data-campus-route="/"] p,
      body[data-campus-spline="active"][data-campus-route="/"] span,
      body[data-campus-spline="active"][data-campus-route="/"] [class*="text-ios-gray-600"],
      body[data-campus-spline="active"][data-campus-route="/"] [class*="text-ios-gray-500"],
      body[data-campus-spline="active"][data-campus-route="/"] [class*="text-ios-gray-400"] {
        color: rgba(224,238,255,.74) !important;
      }
      body[data-campus-spline="active"][data-campus-route="/"] .ios-tabbar-wrap {
        z-index: 8 !important;
      }
      body[data-campus-spline="active"][data-campus-route="/"] .ios-tabbar {
        border-color: rgba(255,255,255,.18) !important;
        background: rgba(9, 16, 32, .58) !important;
        backdrop-filter: blur(28px) saturate(1.36) !important;
        -webkit-backdrop-filter: blur(28px) saturate(1.36) !important;
      }
      .campus-route-transition {
        position: fixed;
        inset: 0;
        z-index: 120;
        display: grid;
        place-items: center;
        overflow: hidden;
        pointer-events: none;
        color: rgba(255,255,255,.96);
        background:
          radial-gradient(circle at 50% 52%, rgba(132,216,255,.32), transparent 18%),
          radial-gradient(circle at 50% 52%, rgba(255,145,214,.22), transparent 34%),
          rgba(4, 7, 17, .18);
        backdrop-filter: blur(0px);
        -webkit-backdrop-filter: blur(0px);
        animation: campus-route-backdrop .68s cubic-bezier(.16, 1, .3, 1) forwards;
        contain: layout paint;
        will-change: opacity, backdrop-filter;
      }
      .campus-route-transition::before,
      .campus-route-transition::after {
        content: "";
        position: absolute;
        left: 50%;
        top: 50%;
        border-radius: 999px;
        transform: translate(-50%, -50%);
        pointer-events: none;
      }
      .campus-route-transition::before {
        width: 210px;
        height: 210px;
        border: 34px solid rgba(185,226,255,.56);
        box-shadow:
          0 0 80px rgba(105,195,255,.44),
          inset 0 0 42px rgba(255,255,255,.32);
        animation: campus-route-ring .68s cubic-bezier(.16, 1, .3, 1) forwards;
        will-change: transform, opacity;
      }
      .campus-route-transition::after {
        width: 54vw;
        height: 54vw;
        max-width: 720px;
        max-height: 720px;
        background:
          conic-gradient(from 160deg, rgba(90,200,250,.08), rgba(255,151,215,.30), rgba(255,255,255,.18), rgba(90,200,250,.08));
        filter: blur(10px);
        opacity: .82;
        animation: campus-route-orbit .68s cubic-bezier(.16, 1, .3, 1) forwards;
        will-change: transform, opacity;
      }
      .campus-route-transition-card {
        position: relative;
        z-index: 1;
        width: min(420px, calc(100vw - 36px));
        min-height: 180px;
        display: grid;
        place-items: center;
        text-align: center;
        padding: 30px;
        border: 1px solid rgba(255,255,255,.24);
        border-radius: 34px;
        background: rgba(9, 16, 32, .52);
        box-shadow: 0 34px 120px rgba(0,0,0,.34), inset 0 1px rgba(255,255,255,.24);
        backdrop-filter: blur(28px) saturate(1.36);
        -webkit-backdrop-filter: blur(28px) saturate(1.36);
        transform-origin: center;
        animation: campus-route-card .68s cubic-bezier(.16, 1, .3, 1) forwards;
        will-change: transform, opacity;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }
      .campus-route-transition-card strong {
        display: block;
        margin-bottom: 10px;
        color: rgba(141,219,255,.96);
        font-size: .82rem;
        letter-spacing: .16em;
        text-transform: uppercase;
      }
      .campus-route-transition-card span {
        display: block;
        font-size: clamp(1.7rem, 7vw, 3rem);
        font-weight: 900;
        line-height: 1.05;
      }
      body.campus-route-transitioning #root,
      body.campus-route-transitioning .campus-login-story {
        animation: campus-route-page-out .68s cubic-bezier(.16, 1, .3, 1) forwards;
      }
      @keyframes campus-route-backdrop {
        0% { opacity: 0; backdrop-filter: blur(0px); -webkit-backdrop-filter: blur(0px); }
        45% { opacity: 1; }
        100% { opacity: 1; backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
      }
      @keyframes campus-route-ring {
        0% { transform: translate(-50%, -50%) scale(.22) rotate(0deg); opacity: 0; }
        48% { opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(6.4) rotate(38deg); opacity: .16; }
      }
      @keyframes campus-route-orbit {
        0% { transform: translate(-50%, -50%) scale(.18) rotate(0deg); opacity: 0; }
        100% { transform: translate(-50%, -50%) scale(1.35) rotate(72deg); opacity: .92; }
      }
      @keyframes campus-route-card {
        0% { transform: translateY(36px) scale(.82) rotateX(18deg); opacity: 0; }
        42% { opacity: 1; }
        100% { transform: translateY(-8px) scale(1.08) rotateX(0deg); opacity: 0; }
      }
      @keyframes campus-route-page-out {
        0% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        100% { opacity: .22; transform: scale(.96) translateY(-12px); filter: blur(8px); }
      }
      @media (max-width: 640px) {
        body[data-campus-route="/login"] {
          min-height: 100svh;
        }
        body[data-campus-route="/login"] .campus-login-story {
          min-height: 238svh;
          padding-bottom: calc(98px + env(safe-area-inset-bottom));
        }
        body[data-campus-route="/login"] .campus-login-hero,
        body[data-campus-route="/login"] .campus-login-band,
        body[data-campus-route="/login"] .campus-login-bottom {
          width: min(calc(100% - 28px), 430px);
        }
        body[data-campus-route="/login"] .campus-login-hero {
          min-height: 100svh;
          padding: max(18px, env(safe-area-inset-top)) 0 34px;
          gap: 14px;
        }
        body[data-campus-route="/login"] .campus-login-hero::after {
          content: "";
          width: 38px;
          height: 5px;
          margin: 0 auto;
          border-radius: 999px;
          background: rgba(224, 238, 255, .56);
          box-shadow: 0 0 24px rgba(132, 216, 255, .26);
          animation: campus-mobile-cue 1.55s ease-in-out infinite;
        }
        body[data-campus-route="/login"] .campus-login-hero h1 {
          font-size: clamp(2.02rem, 9.2vw, 2.42rem) !important;
          line-height: 1.07 !important;
        }
        body[data-campus-route="/login"] .campus-login-hero p {
          font-size: .94rem !important;
          line-height: 1.68 !important;
        }
        body[data-campus-route="/login"] .campus-login-actions {
          row-gap: 8px;
        }
        body[data-campus-route="/login"] .campus-login-visual {
          min-height: min(420px, 48svh) !important;
          border-radius: 30px !important;
        }
        body[data-campus-route="/login"] .campus-ios-preview {
          inset: 16px 14px auto;
          gap: 9px;
        }
        body[data-campus-route="/login"] .campus-ios-preview-card {
          padding: 13px;
          border-radius: 23px;
        }
        body[data-campus-route="/login"] .campus-ios-preview-card strong {
          font-size: .95rem;
        }
        body[data-campus-route="/login"] .campus-ios-preview-card span {
          font-size: .82rem;
          line-height: 1.48;
        }
        body[data-campus-route="/login"] .campus-ios-preview-card:nth-child(2) {
          display: none !important;
        }
        body[data-campus-route="/login"] .campus-ios-metric-row {
          gap: 8px;
        }
        body[data-campus-route="/login"] .campus-ios-metric {
          padding: 9px 6px;
        }
        body[data-campus-route="/login"] .campus-login-band {
          padding-top: 8px;
          padding-bottom: 64px;
        }
        body[data-campus-route="/login"] .campus-login-strip,
        body[data-campus-route="/login"] .campus-login-card,
        body[data-campus-route="/login"] .campus-plan-card {
          border-radius: 24px;
        }
        body[data-campus-route="/login"] .campus-login-bottom {
          min-height: 70svh;
          padding-bottom: calc(18svh + env(safe-area-inset-bottom));
        }
        body[data-campus-route="/login"] .campus-login-bottom h2 {
          font-size: clamp(2.05rem, 10vw, 2.55rem) !important;
          line-height: 1.04 !important;
        }
        body[data-campus-route="/login"] #root > div {
          padding: 10px 10px calc(10px + env(safe-area-inset-bottom));
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md {
          width: min(100%, 372px);
          max-width: min(100%, 372px);
          max-height: min(82svh, calc(100vh - 20px));
          border-radius: 32px !important;
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md .w-28.h-28 {
          width: 58px !important;
          height: 58px !important;
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md input,
        body[data-campus-route="/login"] .campus-code-panel input {
          min-height: 52px !important;
        }
        body[data-campus-route="/login"] .campus-bg-switcher {
          display: none !important;
        }
        @keyframes campus-mobile-cue {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: .42; }
          50% { transform: translate3d(0, 8px, 0); opacity: .92; }
        }
      }
      @media (max-width: 640px) and (max-height: 740px) {
        body[data-campus-route="/login"] #root > div {
          align-items: center;
          padding: 6px 10px calc(6px + env(safe-area-inset-bottom));
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md {
          width: min(100%, 370px);
          max-width: min(100%, 370px);
          max-height: calc(100svh - 12px);
          border-radius: 28px !important;
          scroll-padding: 18px;
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md .text-center.mb-8 {
          margin-bottom: 8px !important;
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md .w-28.h-28 {
          width: 44px !important;
          height: 44px !important;
          margin-bottom: 8px !important;
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md h1,
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md [class*="text-3xl"] {
          font-size: 1.74rem !important;
          line-height: 1.1 !important;
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md .text-center.mb-8 p {
          font-size: .88rem !important;
          line-height: 1.42 !important;
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md form.space-y-4 > :not([hidden]) ~ :not([hidden]) {
          margin-top: 10px !important;
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md label {
          margin-bottom: 5px !important;
          font-size: .9rem !important;
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md input,
        body[data-campus-route="/login"] .campus-code-panel input {
          height: 48px !important;
          min-height: 48px !important;
          border-radius: 18px !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          font-size: 16px !important;
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md button[type="submit"] {
          height: 48px !important;
          min-height: 48px !important;
          margin-top: 12px !important;
        }
        body[data-campus-route="/login"] .campus-code-panel {
          gap: 8px;
          margin-top: 8px;
        }
        body[data-campus-route="/login"] .campus-code-panel button {
          min-height: 46px;
        }
        body[data-campus-route="/login"] .campus-school-help {
          display: none;
        }
        body[data-campus-route="/login"] .campus-school-suggestions {
          max-height: 168px;
          border-radius: 18px;
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md > p,
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md .text-center.text-sm {
          font-size: .84rem !important;
          line-height: 1.42 !important;
        }
        body[data-campus-route="/login"][data-campus-keyboard-focus="true"] #root > div {
          align-items: center;
        }
      }
      @media (max-width: 380px) {
        body[data-campus-route="/login"] .campus-login-hero h1 {
          font-size: 1.96rem !important;
        }
        body[data-campus-route="/login"] .campus-login-visual {
          min-height: min(390px, 46svh) !important;
        }
        body[data-campus-route="/login"] #root > div > .w-full.max-w-md {
          max-height: min(84svh, calc(100vh - 18px));
        }
      }
    `;
    document.head.appendChild(style);
  }

  function patchFetch() {
    window.fetch = (input, init = {}) => {
      const url = typeof input === "string" ? input : input?.url || "";
      if (url.includes("/api/auth/register") && init?.body) {
        try {
          const payload = JSON.parse(init.body);
          const codeInput = document.querySelector("#campus-email-code");
          if (codeInput) {
            payload.emailCode = codeInput.value.trim();
            init = { ...init, body: JSON.stringify(payload) };
          }
        } catch {
          // Keep the original request body.
        }
      }
      return originalFetch(input, init).then((response) => {
        const apiPath = apiPathFromFetchUrl(url);
        const method = String(init?.method || input?.method || "GET").toUpperCase();
        rememberApiResponse(apiPath, method, response);
        if (response.ok && /\/api\/auth\/(login|register)$/.test(url)) {
          setTimeout(() => {
            if (window.location.pathname === "/login" && currentToken()) {
              startHomeToMatchTransition({
                source: "login-to-match",
                title: "登录成功",
                text: "进入你的 3D 匹配卡组",
              });
            }
            ensureUnreadPolling();
          }, 220);
        }
        if (response.ok && /\/api\/(messages|matches)(\/|\?|$)/.test(apiPath)) {
          setTimeout(() => {
            refreshUnreadSummary({ force: true }).catch(() => {});
          }, 450);
        }
        return response;
      });
    };
  }

  function patchHistoryMethod(name) {
    const original = history[name];
    history[name] = function patchedHistoryMethod(...args) {
      const result = original.apply(this, args);
      queueEnhance();
      return result;
    };
  }

  function currentToken() {
    return localStorage.getItem("token") || "";
  }

  function isProtectedRoute(pathname = window.location.pathname) {
    return pathname !== "/" && pathname !== "/login";
  }

  function redirectToLogin({ replace = true } = {}) {
    if (window.location.pathname === "/login") {
      return;
    }

    if (replace) {
      window.location.replace("/login");
    } else {
      window.location.assign("/login");
    }
  }

  function handleLogoutClick(event) {
    const target = event.target.closest?.("button, a");
    if (!target) {
      return;
    }

    const label = `${target.textContent || ""} ${target.getAttribute("aria-label") || ""}`.trim();
    const isLogout = /退出登录|退出|登出|log\s*out/i.test(label);
    if (!isLogout || !currentToken()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();

    target.disabled = true;
    if (target.tagName === "BUTTON") {
      target.textContent = "退出中...";
    }

    localStorage.removeItem("token");
    state.token = "";
    state.user = null;
    state.membership = normalizeMembership(null);
    state.activitySummary = null;
    state.activityCheckedAt = 0;
    document.body.dataset.campusAuthenticated = "false";
    document.body.dataset.campusAdmin = "false";
    document.body.dataset.campusMembership = "free";
    stopUnreadPolling();
    redirectToLogin();
  }

  function setRouteState() {
    document.body.dataset.campusRoute = window.location.pathname;
  }

  function ensureSplineScene() {
    const route = window.location.pathname;
    document.body.dataset.campusSpline = "active";

    if (!document.querySelector('script[data-campus-spline-scene="true"]')) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "/campus-spline-scene.js";
      script.dataset.campusSplineScene = "true";
      document.head.appendChild(script);
    }

    window.dispatchEvent(new CustomEvent("campus:route", {
      detail: { route },
    }));
  }

  function handleRouteTransitionClick(event) {
    if (window.location.pathname !== "/" || event.defaultPrevented) {
      return;
    }

    const target = event.target.closest("a, button");
    if (!target) {
      return;
    }

    const href = target.tagName === "A" ? target.getAttribute("href") || "" : "";
    const label = (target.textContent || "").trim();
    const isMatchEntry = href === "/search.html"
      || href.endsWith("/search.html")
      || /^(开始匹配|进入发现|去看看推荐|去发现|搜索同学)$/.test(label);

    if (!isMatchEntry) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    startHomeToMatchTransition();
  }

  function startHomeToMatchTransition(options = {}) {
    if (document.querySelector("#campus-route-transition")) {
      return;
    }

    const source = options.source || "home-to-match";
    const title = options.title || "Match Deck";
    const transitionMs = 640;
    const text = options.text || "进入 3D 匹配卡组";

    sessionStorage.setItem("campus-route-transition", source);
    document.body.classList.add("campus-route-transitioning");
    window.CampusSplineScene?.focusMatch?.();

    const overlay = document.createElement("div");
    overlay.id = "campus-route-transition";
    overlay.className = "campus-route-transition";
    overlay.innerHTML = `
      <div class="campus-route-transition-card">
        <div>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(text)}</span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
      window.location.assign("/search.html");
    }, transitionMs);
  }

  function queueEnhance() {
    if (state.enhanceQueued) {
      return;
    }

    state.enhanceQueued = true;
    setTimeout(() => {
      state.enhanceQueued = false;
      enhance().catch(() => {
        // Ignore transient enhance failures and let the next mutation retry.
      });
    }, 0);
  }

  async function requestApi(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = currentToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (!headers["Content-Type"] && options.body) {
      headers["Content-Type"] = "application/json";
    }

    const response = await originalFetch(`/api${path}`, {
      ...options,
      headers,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(payload?.message || `Request failed with HTTP ${response.status}`);
    }

    return payload || {};
  }

  function installCampusImageFallbacks() {
    if (state.imageFallbackInstalled) {
      return;
    }

    state.imageFallbackInstalled = true;
    document.addEventListener("error", (event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement) || image.dataset.campusFallbackApplied === "true") {
        return;
      }

      const isCampusAvatar = image.src.includes("/api/uploads/avatars/")
        || Boolean(image.closest(".campus-avatar-control, .campus-activity-avatar"));
      if (!isCampusAvatar) {
        return;
      }

      image.dataset.campusFallbackApplied = "true";
      const fallback = document.createElement("span");
      fallback.className = "campus-avatar-fallback";
      fallback.textContent = avatarFallbackLabel(image);
      image.replaceWith(fallback);
    }, true);

    setTimeout(() => applyCampusAvatarFallbacks(document), 120);
  }

  function applyCampusAvatarFallbacks(root = document) {
    root.querySelectorAll("img").forEach((image) => {
      const isCampusAvatar = image.src.includes("/api/uploads/avatars/")
        || Boolean(image.closest(".campus-avatar-control, .campus-activity-avatar"));
      if (!isCampusAvatar || image.dataset.campusFallbackApplied === "true") {
        return;
      }

      if (image.complete && image.naturalWidth === 0) {
        image.dataset.campusFallbackApplied = "true";
        const fallback = document.createElement("span");
        fallback.className = "campus-avatar-fallback";
        fallback.textContent = avatarFallbackLabel(image);
        image.replaceWith(fallback);
      }
    });
  }

  function avatarFallbackLabel(image) {
    const alt = textFromImageAlt(image);
    const nickname = state.user?.nickname || alt || "同";
    return String(nickname).trim().slice(0, 1) || "同";
  }

  function textFromImageAlt(image) {
    return String(image.getAttribute("alt") || "")
      .replace(/我的头像|头像/g, "")
      .trim();
  }

  function apiPathFromFetchUrl(url) {
    if (!url) {
      return "";
    }

    try {
      const parsed = new URL(url, window.location.origin);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return String(url || "");
    }
  }

  function rememberApiResponse(apiPath, method, response) {
    if (!response.ok || !/\/api\/(messages|matches)(\/|\?|$)/.test(apiPath)) {
      return;
    }

    response.clone().json().then((payload) => {
      if (apiPath.replace(/\?.*$/, "") === "/api/matches" && Array.isArray(payload.data?.matches)) {
        rememberChatMatches(payload.data.matches);
        syncUnreadIndicators(payload.data.matches, payload.data.unreadTotal);
        return;
      }

      const matchId = matchIdFromMessageApiPath(apiPath);
      if (!matchId) {
        return;
      }

      if (payload.data?.match) {
        rememberChatMatch(matchId, payload.data.match);
      }

      if (method === "GET" && Array.isArray(payload.data?.messages)) {
        state.messageThreads.set(matchId, payload.data.messages);
      } else if (method === "POST" && payload.data?.message) {
        const current = state.messageThreads.get(matchId) || [];
        state.messageThreads.set(matchId, [...current, payload.data.message]);
      }

      setTimeout(() => {
        ensureChatTools();
        enhanceChatTimeline();
      }, 90);
    }).catch(() => {
      // Some responses are not JSON; nothing to remember.
    });
  }

  function matchIdFromMessageApiPath(apiPath) {
    const match = String(apiPath || "").match(/\/api\/messages\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function rememberChatMatches(matches = []) {
    if (!Array.isArray(matches)) {
      return;
    }

    matches.forEach((match) => {
      rememberChatMatch(match?.id || match?._id, match);
    });
  }

  function rememberChatMatch(matchId, match) {
    const id = cleanText(matchId || match?.id || match?._id);
    if (!id || !match) {
      return;
    }

    state.chatMatches.set(id, match);
  }

  function currentChatMatchId() {
    if (!window.location.pathname.startsWith("/chat/")) {
      return "";
    }

    return decodeURIComponent(window.location.pathname.replace(/^\/chat\//, "").split(/[/?#]/)[0] || "");
  }

  function currentChatMatch() {
    const matchId = currentChatMatchId();
    return matchId ? state.chatMatches.get(matchId) || null : null;
  }

  function cleanText(value) {
    return String(value || "").trim();
  }

  function unreadLabel(count) {
    return count > 99 ? "99+" : String(Math.max(0, Number(count) || 0));
  }

  function updateDocumentUnreadTitle(total) {
    const base = state.baseTitle || document.title.replace(/^\(\d+\)\s*/, "");
    state.baseTitle = base;
    document.title = total > 0 ? `(${unreadLabel(total)}) ${base}` : base;
  }

  function syncUnreadIndicators(matches = [], unreadTotal = null) {
    const total = Number.isFinite(Number(unreadTotal))
      ? Math.max(0, Number(unreadTotal))
      : matches.reduce((sum, match) => sum + (Number(match.unreadCount) || 0), 0);

    state.unreadTotal = total;
    state.unreadMatches = Array.isArray(matches) ? matches : [];
    document.body.dataset.campusUnread = total > 0 ? "true" : "false";
    updateDocumentUnreadTitle(total);
    updateNavUnreadBadge(total);
    updateThreadUnreadBadges(state.unreadMatches);
    updateMatchPreviewCards(state.unreadMatches);
    updateFloatingUnreadPill(total);
  }

  function updateNavUnreadBadge(total) {
    document.querySelectorAll('a[href="/matches"], a[href$="/matches"]').forEach((link) => {
      link.classList.add("campus-unread-anchor");
      let badge = link.querySelector('.campus-unread-badge[data-campus-nav-badge="true"]');
      if (total > 0) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "campus-unread-badge";
          badge.dataset.campusNavBadge = "true";
          badge.setAttribute("aria-label", "未读消息");
          link.appendChild(badge);
        }
        const label = unreadLabel(total);
        if (badge.textContent !== label) {
          badge.textContent = label;
        }
      } else {
        badge?.remove();
      }
    });
  }

  function matchIdFromChatHref(href) {
    const match = String(href || "").match(/\/chat\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function updateThreadUnreadBadges(matches = []) {
    const unreadById = new Map(matches.map((match) => [String(match.id || match._id || ""), Number(match.unreadCount) || 0]));
    document.querySelectorAll('a[href*="/chat/"]').forEach((link) => {
      const matchId = matchIdFromChatHref(link.getAttribute("href"));
      const count = unreadById.get(matchId) || 0;
      let badge = link.querySelector(".campus-thread-unread");
      if (count > 0) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "campus-unread-badge campus-thread-unread";
          link.appendChild(badge);
        }
        const label = unreadLabel(count);
        if (badge.textContent !== label) {
          badge.textContent = label;
        }
        badge.setAttribute("aria-label", `${count} 条未读消息`);
      } else {
        badge?.remove();
      }
    });

    document.querySelectorAll(".campus-thread-unread").forEach((badge) => {
      if (!badge.closest('a[href*="/chat/"]')) {
        badge.remove();
      }
    });
  }

  function updateMatchPreviewCards(matches = []) {
    const matchById = new Map(matches.map((match) => [String(match.id || match._id || ""), match]));
    document.querySelectorAll('a[href*="/chat/"]').forEach((link) => {
      const match = matchById.get(matchIdFromChatHref(link.getAttribute("href")));
      if (!match) {
        return;
      }

      const unreadCount = Number(match.unreadCount) || 0;
      link.dataset.campusHasUnread = unreadCount > 0 ? "true" : "false";
      const info = link.querySelector('[class*="flex-1"][class*="min-w-0"]');
      if (!info) {
        return;
      }

      let row = info.querySelector(".campus-match-preview-row");
      if (!row) {
        row = document.createElement("div");
        row.className = "campus-match-preview-row";
        info.appendChild(row);
      }

      const previewText = buildLastMessagePreview(match);
      const timeText = formatThreadTime(match.lastMessageAt || match.matchedAt);
      const signature = `${previewText}__${timeText}__${unreadCount}`;
      if (row.dataset.signature === signature) {
        return;
      }

      row.dataset.signature = signature;
      row.innerHTML = `
        <span class="campus-match-preview-text">${escapeHtml(previewText)}</span>
        <span class="campus-match-preview-time">${escapeHtml(timeText)}</span>
      `;
      link.setAttribute("aria-label", `${match.user?.nickname || "匹配对象"}，${previewText}`);
    });
  }

  function buildLastMessagePreview(match) {
    const content = cleanText(match.lastMessagePreview);
    if (!content) {
      return "刚刚匹配，打个招呼吧";
    }

    const senderId = cleanText(match.lastMessageSenderId);
    return `${isCurrentUserId(senderId) ? "我：" : ""}${content}`;
  }

  function isCurrentUserId(id) {
    const value = cleanText(id);
    if (!value) {
      return false;
    }

    return [state.user?.id, state.user?._id, "me"].map(cleanText).includes(value);
  }

  function senderIdForClient(message) {
    return cleanText(message?.senderId || message?.sender?.id || message?.sender?._id || message?.sender);
  }

  function isCurrentUserSender(message) {
    return isCurrentUserId(senderIdForClient(message));
  }

  function toValidDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function isSameLocalDate(a, b) {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  function isYesterday(date, now = new Date()) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return isSameLocalDate(date, yesterday);
  }

  function formatHourMinute(date) {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }

  function formatThreadTime(value) {
    const date = toValidDate(value);
    if (!date) {
      return "";
    }

    const now = new Date();
    if (isSameLocalDate(date, now)) {
      return formatHourMinute(date);
    }
    if (isYesterday(date, now)) {
      return "昨天";
    }
    if (date.getFullYear() === now.getFullYear()) {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  }

  function formatMessageTime(value) {
    const date = toValidDate(value);
    if (!date) {
      return "";
    }

    const now = new Date();
    if (isSameLocalDate(date, now)) {
      return formatHourMinute(date);
    }
    if (isYesterday(date, now)) {
      return `昨天 ${formatHourMinute(date)}`;
    }
    return `${date.getMonth() + 1}月${date.getDate()}日 ${formatHourMinute(date)}`;
  }

  function localDateKey(value) {
    const date = toValidDate(value);
    if (!date) {
      return "";
    }

    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  function dateChipLabel(value) {
    const date = toValidDate(value);
    if (!date) {
      return "";
    }

    const now = new Date();
    if (isSameLocalDate(date, now)) {
      return "今天";
    }
    if (isYesterday(date, now)) {
      return "昨天";
    }
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  function enhanceChatTimeline() {
    if (!window.location.pathname.startsWith("/chat/")) {
      return;
    }

    const matchId = currentChatMatchId();
    const messages = state.messageThreads.get(matchId) || [];
    if (!messages.length) {
      return;
    }
    const match = state.chatMatches.get(matchId) || null;

    const contentNodes = Array.from(document.querySelectorAll('body[data-campus-route^="/chat/"] p'))
      .filter((node) => !node.children.length && messages.some((message) => cleanText(message.content) === cleanText(node.textContent)));
    const usedNodes = new Set();
    let previousDateKey = "";

    messages.forEach((message) => {
      const content = cleanText(message.content);
      if (!content) {
        return;
      }

      const contentNode = contentNodes.find((node) => !usedNodes.has(node) && cleanText(node.textContent) === content);
      if (!contentNode) {
        return;
      }
      usedNodes.add(contentNode);

      const bubble = contentNode.parentElement;
      const row = bubble?.closest('div[class*="justify-end"], div[class*="justify-start"]');
      if (!bubble || !row) {
        return;
      }

      const mine = isCurrentUserSender(message) || row.className.includes("justify-end");
      row.classList.add("campus-message-row");
      row.dataset.campusSender = mine ? "me" : "them";
      bubble.classList.add("campus-message-bubble");
      bubble.classList.toggle("is-mine", mine);
      bubble.classList.toggle("is-theirs", !mine);
      ensureMessageAvatar(row, bubble, mine, message, match);

      const timeNode = Array.from(bubble.querySelectorAll("span")).find((node) => !node.children.length);
      const messageAt = message.createdAt || message.time;
      const timeText = formatMessageTime(messageAt);
      if (timeNode && timeText) {
        timeNode.classList.add("campus-message-time");
        timeNode.title = toValidDate(messageAt)?.toLocaleString("zh-CN") || "";
        if (timeNode.textContent.trim() !== timeText) {
          timeNode.textContent = timeText;
        }
      }

      const key = localDateKey(messageAt);
      if (key && key !== previousDateKey) {
        ensureDateChipBefore(row, key, dateChipLabel(messageAt));
        previousDateKey = key;
      }
    });
  }

  function ensureDateChipBefore(row, key, label) {
    const previous = row.previousElementSibling;
    if (previous?.classList.contains("campus-chat-date-chip") && previous.dataset.dateKey === key) {
      return;
    }

    if (previous?.classList.contains("campus-chat-date-chip") && previous.dataset.dateKey !== key) {
      previous.remove();
    }

    const chip = document.createElement("div");
    chip.className = "campus-chat-date-chip";
    chip.dataset.dateKey = key;
    chip.innerHTML = `<span>${escapeHtml(label)}</span>`;
    row.insertAdjacentElement("beforebegin", chip);
  }

  function ensureMessageAvatar(row, bubble, mine, message, match) {
    const messageItem = directChildWithin(row, bubble) || bubble;
    messageItem.classList.add("campus-message-item");
    let avatar = Array.from(row.children).find((child) => child.classList?.contains("campus-chat-avatar"));
    if (!avatar) {
      avatar = document.createElement("span");
      avatar.className = "campus-chat-avatar";
      avatar.setAttribute("aria-hidden", "true");
      row.insertBefore(avatar, messageItem);
    }

    const user = mine ? state.user : (match?.user || message?.sender || null);
    renderAvatarNode(avatar, user, mine ? "我" : "同");
  }

  function directChildWithin(parent, node) {
    let current = node;
    while (current?.parentElement && current.parentElement !== parent) {
      current = current.parentElement;
    }
    return current?.parentElement === parent ? current : null;
  }

  function renderAvatarNode(node, user, fallback = "同") {
    if (!node) {
      return;
    }

    const avatar = cleanText(user?.avatar || user?.avatarUrl || user?.image || user?.imageUrl);
    const label = initialsForUser(user, fallback);
    node.textContent = avatar ? "" : label;
    node.classList.toggle("has-image", Boolean(avatar));
    node.style.backgroundImage = avatar ? `url("${cssUrl(avatar)}")` : "";
    node.title = cleanText(user?.nickname || user?.name) || fallback;
  }

  function initialsForUser(user, fallback = "同") {
    const name = cleanText(user?.nickname || user?.name || user?.email || fallback);
    return name ? name.slice(0, 1).toUpperCase() : fallback;
  }

  function cssUrl(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, "%22").replace(/\)/g, "%29");
  }

  function ensureChatTools() {
    if (!window.location.pathname.startsWith("/chat/")) {
      document.querySelector("#campus-chat-header-assist")?.remove();
      document.querySelector("#campus-chat-quick-openers")?.remove();
      closeChatProfileDrawer();
      return;
    }

    const matchId = currentChatMatchId();
    if (!matchId) {
      return;
    }

    const match = currentChatMatch();
    ensureChatHeader(matchId, match);
    ensureChatQuickOpeners(matchId, match);
    ensureChatProfileDrawer(matchId, match);
  }

  function ensureChatHeader(matchId, match) {
    const root = document.querySelector("#root");
    const container = document.querySelector("#root main") || root?.firstElementChild || root;
    if (!container) {
      return;
    }

    let header = document.querySelector("#campus-chat-header-assist");
    if (!header) {
      header = document.createElement("section");
      header.id = "campus-chat-header-assist";
      header.className = "campus-chat-header-assist";
      header.setAttribute("aria-label", "聊天对象");
    }
    if (header.parentElement !== container) {
      container.insertBefore(header, container.firstChild);
    }

    const user = match?.user || null;
    const signature = [
      matchId,
      cleanText(user?.nickname),
      cleanText(user?.avatar),
      chatMetaLine(user),
      match?.identityRevealed ? "revealed" : "private",
    ].join("|");
    if (header.dataset.signature === signature) {
      return;
    }
    header.dataset.signature = signature;

    const avatarStyle = avatarInlineStyle(user);
    const avatarClass = cleanText(user?.avatar) ? " has-image" : "";
    header.innerHTML = `
      <div class="campus-chat-header-user">
        <span class="campus-chat-header-avatar${avatarClass}" style="${avatarStyle}">${escapeHtml(initialsForUser(user, "同"))}</span>
        <div class="campus-chat-header-copy">
          <strong>${escapeHtml(cleanText(user?.nickname) || "聊天对象")}</strong>
          <span>${escapeHtml(chatMetaLine(user) || "先从一句轻松的问候开始")}</span>
        </div>
      </div>
      <div class="campus-chat-header-actions">
        <span class="campus-chat-status-pill">${escapeHtml(match?.identityRevealed ? "已互相展示资料" : "先匿名聊着")}</span>
        <button class="campus-chat-profile-button" type="button" data-chat-profile-open>资料</button>
      </div>
    `;
    header.querySelector("[data-chat-profile-open]")?.addEventListener("click", openChatProfileDrawer);
  }

  function ensureChatQuickOpeners(matchId, match) {
    const root = document.querySelector("#root");
    const container = document.querySelector("#root main") || root?.firstElementChild || root;
    if (!container) {
      return;
    }

    let panel = document.querySelector("#campus-chat-quick-openers");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "campus-chat-quick-openers";
      panel.className = "campus-chat-quick-openers";
      panel.setAttribute("aria-label", "快捷开场白");
    }

    const composer = findChatComposerContainer();
    if (composer && panel.nextElementSibling !== composer) {
      composer.parentElement?.insertBefore(panel, composer);
    } else if (!composer && panel.parentElement !== container) {
      container.appendChild(panel);
    }

    const openers = buildQuickOpeners(match?.user);
    const signature = `${matchId}|${openers.join("|")}`;
    if (panel.dataset.signature !== signature) {
      panel.dataset.signature = signature;
      panel.innerHTML = openers.map((text) => (
        `<button type="button" data-chat-opener="${escapeAttr(text)}">${escapeHtml(text)}</button>`
      )).join("");
    }

    panel.querySelectorAll("[data-chat-opener]").forEach((button) => {
      if (button.dataset.bound === "true") {
        return;
      }
      button.dataset.bound = "true";
      button.addEventListener("click", () => {
        fillChatComposer(button.dataset.chatOpener || button.textContent || "");
      });
    });
  }

  function buildQuickOpeners(user) {
    const school = cleanText(user?.school);
    const nickname = cleanText(user?.nickname);
    const topic = cleanText((user?.tags || user?.sceneTags || [])[0]);
    return [
      school ? `你最近在${school}附近吗？` : "你今天在学校附近吗？",
      nickname ? `看到你的资料感觉挺合拍的，${nickname}最近在忙什么？` : "看到你的资料感觉挺合拍的，最近在忙什么？",
      topic ? `你也喜欢${topic}吗？` : "最近有什么想一起做的事吗？",
      "要不要先互相说一个最近喜欢的地方？",
    ];
  }

  function findChatComposerContainer() {
    const field = findChatComposerField();
    if (!field) {
      return null;
    }

    let node = field.parentElement;
    while (node && node !== document.body) {
      const className = String(node.className || "");
      const hasComposerShape = /flex/.test(className)
        && /items-end/.test(className)
        && Array.from(node.querySelectorAll("button")).some(isVisibleElement);
      if (hasComposerShape) {
        return node;
      }
      node = node.parentElement;
    }

    return field.closest("form") || field.parentElement;
  }

  function findChatComposerField() {
    const fields = Array.from(document.querySelectorAll('body[data-campus-route^="/chat/"] textarea, body[data-campus-route^="/chat/"] input[type="text"], body[data-campus-route^="/chat/"] input:not([type])'))
      .filter((field) => isVisibleElement(field));
    return fields.find((field) => {
      const placeholder = cleanText(field.getAttribute("placeholder"));
      const formText = cleanText(field.closest("form")?.textContent);
      return /消息|输入想说|发送|聊天/.test(`${placeholder} ${formText}`);
    }) || fields[fields.length - 1] || null;
  }

  function fillChatComposer(text) {
    const field = findChatComposerField();
    if (!field) {
      return;
    }

    setFormValue(field, text);
    field.focus({ preventScroll: true });
  }

  function setFormValue(field, value) {
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), "value");
    if (descriptor?.set) {
      descriptor.set.call(field, value);
    } else {
      field.value = value;
    }
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function isVisibleElement(element) {
    return Boolean(element && (element.offsetWidth || element.offsetHeight || element.getClientRects().length));
  }

  function ensureChatProfileDrawer(matchId, match) {
    let drawer = document.querySelector("#campus-chat-profile-drawer");
    if (!drawer) {
      drawer = document.createElement("aside");
      drawer.id = "campus-chat-profile-drawer";
      drawer.className = "campus-chat-profile-drawer";
      drawer.setAttribute("aria-hidden", "true");
      drawer.innerHTML = `
        <div class="campus-chat-drawer-scrim" data-chat-profile-close></div>
        <div class="campus-chat-drawer-panel" role="dialog" aria-modal="true" aria-label="对方资料">
          <div class="campus-chat-drawer-content"></div>
        </div>
      `;
      drawer.addEventListener("click", (event) => {
        if (event.target.closest("[data-chat-profile-close]")) {
          closeChatProfileDrawer();
        }
      });
      document.body.appendChild(drawer);
    }

    drawer.dataset.matchId = matchId;
    renderChatProfileDrawer(drawer, match);
  }

  function renderChatProfileDrawer(drawer, match) {
    const content = drawer?.querySelector(".campus-chat-drawer-content");
    if (!content) {
      return;
    }

    const user = match?.user || {};
    const tags = uniqueProfileTags(user).slice(0, 8);
    const avatarStyle = avatarInlineStyle(user);
    const avatarClass = cleanText(user?.avatar) ? " has-image" : "";
    const signature = JSON.stringify({
      id: match?.id || match?._id || "",
      nickname: user?.nickname || "",
      avatar: user?.avatar || "",
      school: user?.school || "",
      major: user?.major || "",
      grade: user?.grade || "",
      mbti: user?.mbti || "",
      birthDate: user?.birthDate || "",
      bio: user?.bio || user?.description || "",
      tags,
      revealed: Boolean(match?.identityRevealed),
    });
    if (content.dataset.signature === signature) {
      return;
    }
    content.dataset.signature = signature;

    content.innerHTML = `
      <div class="campus-chat-drawer-top">
        <span class="campus-chat-status-pill">${escapeHtml(match?.identityRevealed ? "已互相展示资料" : "先匿名聊着")}</span>
        <button class="campus-chat-drawer-close" type="button" aria-label="关闭" data-chat-profile-close>×</button>
      </div>
      <div class="campus-chat-drawer-hero">
        <span class="campus-chat-drawer-avatar${avatarClass}" style="${avatarStyle}">${escapeHtml(initialsForUser(user, "同"))}</span>
        <h3>${escapeHtml(cleanText(user?.nickname) || "聊天对象")}</h3>
        <p>${escapeHtml(chatMetaLine(user) || "资料还不多，可以从聊天里慢慢了解。")}</p>
      </div>
      <div class="campus-chat-drawer-grid">
        <div class="campus-chat-drawer-metric"><span>学校</span><strong>${escapeHtml(cleanText(user?.school) || "暂未填写")}</strong></div>
        <div class="campus-chat-drawer-metric"><span>专业年级</span><strong>${escapeHtml([user?.major, user?.grade].map(cleanText).filter(Boolean).join(" · ") || "暂未填写")}</strong></div>
        <div class="campus-chat-drawer-metric"><span>MBTI</span><strong>${escapeHtml(cleanText(user?.mbti) || "暂未填写")}</strong></div>
        <div class="campus-chat-drawer-metric"><span>生辰</span><strong>${escapeHtml(formatChatBirthDate(user?.birthDate || user?.birthday))}</strong></div>
      </div>
      <div class="campus-chat-drawer-section">
        <span>想认识怎样的人</span>
        <p>${escapeHtml(cleanText(user?.bio || user?.description) || "还没有写简介，先从一句问候开始也很好。")}</p>
      </div>
      <div class="campus-chat-drawer-section">
        <span>兴趣标签</span>
        <div class="campus-chat-drawer-tags">
          ${tags.length ? tags.map((tag) => `<em>${escapeHtml(tag)}</em>`).join("") : "<em>慢慢了解</em>"}
        </div>
      </div>
      <button class="campus-chat-drawer-secondary" type="button" data-chat-profile-close>继续聊天</button>
    `;
  }

  function openChatProfileDrawer() {
    ensureChatProfileDrawer(currentChatMatchId(), currentChatMatch());
    document.body.dataset.campusChatDrawer = "open";
    const drawer = document.querySelector("#campus-chat-profile-drawer");
    drawer?.setAttribute("aria-hidden", "false");
    updateScrollLock();
  }

  function closeChatProfileDrawer() {
    if (document.body.dataset.campusChatDrawer === "open") {
      document.body.dataset.campusChatDrawer = "closed";
    }
    document.querySelector("#campus-chat-profile-drawer")?.setAttribute("aria-hidden", "true");
    updateScrollLock();
  }

  function chatMetaLine(user) {
    return [user?.school, user?.major, user?.grade].map(cleanText).filter(Boolean).join(" · ");
  }

  function avatarInlineStyle(user) {
    const avatar = cleanText(user?.avatar || user?.avatarUrl || user?.image || user?.imageUrl);
    return avatar ? `background-image:url("${cssUrl(avatar)}")` : "";
  }

  function uniqueProfileTags(user) {
    return [...new Set([
      ...(Array.isArray(user?.tags) ? user.tags : []),
      ...(Array.isArray(user?.sceneTags) ? user.sceneTags : []),
      ...(Array.isArray(user?.matchModes) ? user.matchModes : []),
    ].map(cleanText).filter(Boolean))];
  }

  function formatChatBirthDate(value) {
    const text = cleanText(value);
    if (!text) {
      return "暂未填写";
    }

    const date = toValidDate(text);
    if (!date) {
      return text;
    }
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  function updateFloatingUnreadPill(total) {
    let pill = document.querySelector("#campus-unread-pill");
    if (!total || !currentToken() || window.location.pathname === "/login") {
      pill?.remove();
      return;
    }

    if (!pill) {
      pill = document.createElement("div");
      pill.id = "campus-unread-pill";
      document.body.appendChild(pill);
    }

    const countLabel = unreadLabel(total);
    if (pill.dataset.count === countLabel) {
      return;
    }

    pill.dataset.count = countLabel;
    pill.innerHTML = `<a href="/matches" aria-label="${total} 条未读消息"><span class="campus-unread-badge">${countLabel}</span><span>条新消息</span></a>`;
  }

  async function refreshUnreadSummary({ force = false } = {}) {
    if (!currentToken()) {
      stopUnreadPolling();
      return;
    }
    if (state.unreadFetching) {
      return;
    }
    if (!force && Date.now() - state.unreadCheckedAt < 12000) {
      return;
    }

    state.unreadFetching = true;
    try {
      const payload = await requestApi("/matches");
      const matches = payload.data?.matches || [];
      syncUnreadIndicators(matches, payload.data?.unreadTotal);
      state.unreadCheckedAt = Date.now();
    } catch {
      // Transient network errors should not interrupt the page.
    } finally {
      state.unreadFetching = false;
    }
  }

  function ensureUnreadPolling() {
    if (!currentToken()) {
      stopUnreadPolling();
      return;
    }

    refreshUnreadSummary().catch(() => {});
    if (!state.unreadPollTimer) {
      state.unreadPollTimer = window.setInterval(() => {
        refreshUnreadSummary().catch(() => {});
      }, 15000);
    }
  }

  function stopUnreadPolling() {
    if (state.unreadPollTimer) {
      clearInterval(state.unreadPollTimer);
      state.unreadPollTimer = null;
    }
    state.unreadFetching = false;
    state.unreadCheckedAt = 0;
    syncUnreadIndicators([], 0);
  }

  async function refreshUser(force = false) {
    const token = currentToken();
    if (!token) {
      state.token = "";
      state.user = null;
      state.membership = normalizeMembership(null);
      state.activitySummary = null;
      state.activityCheckedAt = 0;
      document.body.dataset.campusAuthenticated = "false";
      document.body.dataset.campusAdmin = "false";
      document.body.dataset.campusMembership = "free";
      stopUnreadPolling();
      guardAdminRoute();
      if (isProtectedRoute()) {
        redirectToLogin();
      }
      refreshProfileMembershipDecorations();
      return;
    }

    if (!force && state.token === token && Date.now() - state.checkedAt < 10000) {
      return;
    }

    const hadToken = Boolean(state.token);
    state.token = token;
    state.checkedAt = Date.now();

    try {
      const payload = await requestApi("/auth/me");
      state.user = payload.data?.user || null;
      state.membership = normalizeMembership(state.user?.membership);
      document.body.dataset.campusAuthenticated = "true";
      document.body.dataset.campusAdmin = state.user?.isAdmin ? "true" : "false";
      document.body.dataset.campusMembership = state.membership.planId;
      ensureUnreadPolling();
      if (!hadToken && (window.location.pathname === "/login" || window.location.pathname === "/")) {
        setTimeout(() => {
          if (currentToken()) {
            startHomeToMatchTransition({
              source: "login-to-match",
              title: "登录成功",
              text: "进入你的 3D 匹配卡组",
            });
          }
        }, 260);
      }
    } catch {
      state.user = null;
      state.membership = normalizeMembership(null);
      document.body.dataset.campusAuthenticated = "false";
      document.body.dataset.campusAdmin = "false";
      document.body.dataset.campusMembership = "free";
      stopUnreadPolling();
      if (isProtectedRoute()) {
        localStorage.removeItem("token");
        redirectToLogin();
      }
    }

    guardAdminRoute();
    refreshProfileMembershipDecorations();
  }

  function normalizeMembership(raw) {
    const rawId = String(raw?.planId || raw?.type || raw?.previousPlanId || "free").toLowerCase();
    const fallback = MEMBERSHIP_PLANS.find((plan) => plan.id === rawId) || MEMBERSHIP_PLANS[0];
    const status = raw?.status || "active";

    if (status === "expired") {
      return {
        ...MEMBERSHIP_PLANS[0],
        planId: rawId,
        title: "会员已过期",
        badgeLabel: "会员已过期",
        description: "你之前的会员权益已到期，当前已回到免费权益。",
        expiresAt: raw?.expiredAt || raw?.expiresAt || null,
        isExpired: true,
        isPaid: false,
        features: [...MEMBERSHIP_PLANS[0].features],
        limits: { ...MEMBERSHIP_PLANS[0].limits },
      };
    }

    const plan = MEMBERSHIP_PLANS.find((item) => item.id === rawId) || MEMBERSHIP_PLANS[0];
    return {
      ...plan,
      title: raw?.title || plan.name,
      badgeLabel: raw?.title || plan.name,
      expiresAt: raw?.expiresAt || null,
      startedAt: raw?.startedAt || null,
      billingCycle: raw?.billingCycle || null,
      price: typeof raw?.price === "number" ? raw.price : null,
      status,
      isExpired: false,
      isPaid: plan.id !== "free",
      features: Array.isArray(raw?.features) && raw.features.length ? raw.features : [...plan.features],
      limits: raw?.limits || { ...plan.limits },
    };
  }

  function formatDate(value) {
    if (!value) {
      return "长期有效";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "长期有效";
    }

    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).format(date);
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
    return escapeHtml(value);
  }

  function rewriteAudienceCopy(root = document) {
    root.querySelectorAll("p, span, div, label, button, h1, h2, h3, strong, a").forEach((node) => {
      if (node.children.length) {
        return;
      }
      const text = node.textContent.trim();
      const nextText = AUDIENCE_COPY_REPLACEMENTS.get(text);
      if (nextText && text !== nextText) {
        node.textContent = nextText;
      }
    });

    root.querySelectorAll("[placeholder]").forEach((node) => {
      const nextText = AUDIENCE_COPY_REPLACEMENTS.get(node.getAttribute("placeholder") || "");
      if (nextText) {
        node.setAttribute("placeholder", nextText);
      }
    });
  }

  function updateScrollLock() {
    const shouldLock = document.body.dataset.campusLoginOverlay === "open"
      || document.body.dataset.campusMembershipModal === "open"
      || document.body.dataset.campusActivityModal === "open"
      || document.body.dataset.campusAvatarSheet === "open"
      || document.body.dataset.campusChatDrawer === "open";
    document.documentElement.style.overflow = shouldLock ? "hidden" : "";
    document.body.style.overflow = shouldLock ? "hidden" : "";
  }

  function handleGlobalKeydown(event) {
    if (event.key !== "Escape") {
      return;
    }

    if (document.body.dataset.campusMembershipModal === "open") {
      closeMembershipCenter();
      return;
    }

    if (document.body.dataset.campusActivityModal === "open") {
      closeActivityModal();
      return;
    }

    if (document.body.dataset.campusAvatarSheet === "open") {
      closeAvatarSourceSheet();
      return;
    }

    if (document.body.dataset.campusChatDrawer === "open") {
      closeChatProfileDrawer();
      return;
    }

    if (document.body.dataset.campusLoginOverlay === "open") {
      closeLoginOverlay({ restoreTop: true });
    }
  }

  function guardAdminRoute() {
    if (window.location.pathname !== "/admin/verification") {
      return;
    }

    window.location.replace("/admin.html");
  }

  function enhanceAuthPage() {
    if (window.location.pathname !== "/login") {
      return;
    }

    document.querySelectorAll("label, p, div, span").forEach((node) => {
      if (node.childNodes.length === 1 && node.textContent.trim() === "学校邮箱") {
        node.textContent = "QQ邮箱";
      }
      if (node.childNodes.length === 1 && node.textContent.trim() === "使用学校邮箱完成真实身份认证") {
        node.textContent = "使用 QQ 邮箱接收注册验证码";
      }
    });

    const emailInput = document.querySelector('input[type="email"]');
    if (emailInput) {
      emailInput.placeholder = "123456@qq.com";
      emailInput.inputMode = "email";
    }

    const submitButton = Array.from(document.querySelectorAll("button"))
      .find((button) => button.textContent.trim() === "创建账号");
    const existingPanel = document.querySelector("#campus-code-panel");

    if (!submitButton) {
      existingPanel?.remove();
      return;
    }

    if (existingPanel || !emailInput) {
      return;
    }

    const field = emailInput.closest("div")?.parentElement || emailInput.parentElement;
    const panel = document.createElement("div");
    panel.id = "campus-code-panel";
    panel.className = "campus-code-panel";
    panel.innerHTML = `
      <input id="campus-email-code" inputmode="numeric" maxlength="6" placeholder="输入 6 位验证码" autocomplete="one-time-code" />
      <button id="campus-send-code" type="button">发送验证码</button>
      <div class="campus-code-message" id="campus-code-message"></div>
    `;
    field.insertAdjacentElement("afterend", panel);

    const sendButton = panel.querySelector("#campus-send-code");
    const message = panel.querySelector("#campus-code-message");
    sendButton.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      message.textContent = "发送中...";
      sendButton.disabled = true;

      try {
        const payload = await requestApi("/auth/send-code", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        message.textContent = payload.data?.debugCode
          ? `本地验证码：${payload.data.debugCode}`
          : "验证码已发送，请查收 QQ 邮箱";
      } catch (error) {
        message.textContent = error.message || "发送失败";
      } finally {
        setTimeout(() => {
          sendButton.disabled = false;
        }, 60000);
      }
    });
  }

  function ensureLegalLinksAndConsent() {
    if (window.location.pathname !== "/login") {
      document.querySelector("#campus-register-consent")?.remove();
      return;
    }

    document.querySelectorAll('a[href="#"], a[href="/privacy"], a[href="/terms"]').forEach((link) => {
      const text = link.textContent.trim();
      if (text.includes("用户协议")) {
        link.href = "/terms";
        link.target = "_blank";
        link.rel = "noreferrer";
      }
      if (text.includes("隐私政策")) {
        link.href = "/privacy";
        link.target = "_blank";
        link.rel = "noreferrer";
      }
    });

    const form = document.querySelector("#root form");
    const submitButton = form
      ? Array.from(form.querySelectorAll('button[type="submit"], button'))
          .find((button) => button.textContent.includes("创建账号"))
      : null;
    const existing = document.querySelector("#campus-register-consent");

    if (!form || !submitButton) {
      existing?.remove();
      return;
    }

    if (!existing) {
      const row = document.createElement("label");
      row.id = "campus-register-consent";
      row.className = "campus-consent-row";
      row.innerHTML = `
        <input id="campus-consent-checkbox" type="checkbox" required />
        <span>我已阅读并同意 <a href="/terms" target="_blank" rel="noreferrer">用户协议</a> 和 <a href="/privacy" target="_blank" rel="noreferrer">隐私政策</a>，并同意平台为注册、校园认证和匹配服务处理必要信息。</span>
      `;
      submitButton.insertAdjacentElement("beforebegin", row);
    }

    if (form.dataset.campusConsentBound === "true") {
      return;
    }

    form.dataset.campusConsentBound = "true";
    form.addEventListener("submit", (event) => {
      const consent = document.querySelector("#campus-consent-checkbox");
      const isRegistering = Array.from(form.querySelectorAll("button"))
        .some((button) => button.textContent.includes("创建账号"));
      if (!isRegistering || !consent) {
        return;
      }
      if (!consent.checked) {
        consent.setCustomValidity("请先阅读并同意用户协议和隐私政策");
        consent.reportValidity();
        event.preventDefault();
        event.stopImmediatePropagation();
      } else {
        consent.setCustomValidity("");
      }
    }, true);
  }

  function ensureQuickActions() {
    let actions = document.querySelector("#campus-quick-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.id = "campus-quick-actions";
      actions.className = "campus-quick-actions";
      actions.innerHTML = `
        <a href="/search.html">搜索同学</a>
        <a href="/upload.html">上传校园卡</a>
      `;
      document.body.appendChild(actions);
    }
  }

  function ensureHomeBusinessModules() {
    if (window.location.pathname !== "/") {
      document.querySelector("#campus-home-business")?.remove();
      return;
    }

    const homeHero = document.querySelector(".campus-home-hero-card")
      || document.querySelector("#root h2")?.closest(".apple-card");
    if (!homeHero) {
      return;
    }

    let panel = document.querySelector("#campus-home-business");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "campus-home-business";
      panel.className = "campus-business-home";
      homeHero.insertAdjacentElement("afterend", panel);
    }

    const renderKey = buildHomeBusinessRenderKey();
    if (panel.dataset.renderKey !== renderKey) {
      panel.dataset.renderKey = renderKey;
      panel.innerHTML = buildHomeBusinessModulesHtml();
    }

    bindHomeBusinessModules(panel);
  }

  function buildHomeBusinessRenderKey() {
    const userKey = state.user?.id || state.user?._id || state.user?.email || "guest";
    const school = cleanText(state.user?.school || state.user?.university || "");
    return `${userKey}:${school}:${getDailyBusinessScore()}`;
  }

  function getDailyBusinessScore() {
    const today = new Date().toISOString().slice(0, 10);
    const seed = `${state.user?.id || state.user?._id || state.user?.email || "guest"}:${today}`;
    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
      hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0;
    }
    return 72 + (Math.abs(hash) % 19);
  }

  function buildHomeBusinessModulesHtml() {
    const school = cleanText(state.user?.school || state.user?.university || "") || "同校";
    const score = getDailyBusinessScore();
    const intro = school === "同校"
      ? "今天适合先看看同校推荐、学习搭子和低压力轻聊，找到聊得来的节奏。"
      : `今天在 ${school} 的同频信号不错，适合从同校推荐和兴趣搭子开始认识。`;
    const metrics = [
      { label: "同校", value: Math.min(96, score + 5), color: "#8fd8ff" },
      { label: "兴趣", value: Math.max(58, score - 4), color: "#ffd166" },
      { label: "节奏", value: Math.max(60, score + 1), color: "#a7b8ff" },
      { label: "活跃", value: Math.max(56, score - 9), color: "#51f2c2" },
    ];
    const shortcuts = [
      { title: "同校匹配", text: "先看同校同频的人", icon: "同", href: "/search.html" },
      { title: "校园认证", text: "让同学更放心认识你", icon: "证", href: "/upload.html" },
      { title: "MBTI 档案", text: "用性格类型破冰", icon: "MB", href: "/profile", badge: "新" },
      { title: "生辰合拍", text: "生日节奏轻松破冰", icon: "生", href: "/profile", badge: "新" },
      { title: "兴趣星盘", text: "用兴趣找到话题入口", icon: "趣", href: "/profile" },
      { title: "学习搭子", text: "自习、图书馆、备考", icon: "学", href: "/search.html" },
      { title: "夜跑搭子", text: "操场散步和运动同伴", icon: "跑", href: "/search.html" },
      { title: "匿名聊天", text: "先轻松聊，再决定认识", icon: "聊", href: "/matches" },
      { title: "会员权益", text: "更多推荐和优先曝光", icon: "会", href: "/profile" },
    ];
    const channels = ["为你推荐", "同校", "搭子", "MBTI", "生辰", "活动", "树洞", "心理"];
    const feed = [
      { title: "今晚操场夜跑局", tag: "运动搭子", text: "适合想轻松见一面的人，先从一圈操场开始。", href: "/search.html" },
      { title: "图书馆自习同频", tag: "学习搭子", text: "找一个安静坐得住的人，把今天的任务一起完成。", href: "/search.html" },
      { title: "MBTI 同频话题", tag: "性格破冰", text: "用性格类型找开场白，先聊舒服，再慢慢认识。", href: "/profile" },
      { title: "生辰合拍小卡", tag: "生日节奏", text: "把生日当作轻松话题入口，找到更自然的聊天节奏。", href: "/profile" },
      { title: "低压力匿名轻聊", tag: "树洞聊天", text: "不急着展示身份，先聊聊最近的校园生活。", href: "/matches" },
    ];

    return `
      <div class="campus-business-heading">
        <div>
          <h3>今天可以从这里开始</h3>
          <p>${escapeHtml(intro)}</p>
        </div>
        <span class="campus-business-live">今日推荐已更新</span>
      </div>

      <form class="campus-business-search" data-business-search>
        <span aria-hidden="true">找</span>
        <input name="keyword" type="search" autocomplete="off" placeholder="找同校、MBTI、生辰、搭子、树洞话题" />
        <button type="submit">发现</button>
      </form>

      <div class="campus-business-status">
        <div class="campus-business-score">
          <small>今日合拍度</small>
          <strong>${score}<span> 分</span></strong>
          <p>系统会优先帮你看同校、兴趣和相处节奏更接近的人。完善资料后，这个结果会更准。</p>
        </div>
        <div class="campus-business-metrics" aria-label="今日推荐指标">
          ${metrics.map((item) => `
            <div class="campus-business-meter" style="--meter-value:${Math.max(.2, item.value / 100)};--meter-color:${item.color}">
              <i aria-hidden="true"></i>
              <b>${item.value}</b>
              <span>${escapeHtml(item.label)}</span>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="campus-business-shortcuts" aria-label="常用功能">
        ${shortcuts.map((item) => `
          <a class="campus-business-shortcut" href="${escapeAttr(item.href)}">
            <span class="campus-business-icon">${escapeHtml(item.icon)}</span>
            ${item.badge ? `<span class="campus-business-badge">${escapeHtml(item.badge)}</span>` : ""}
            <b>${escapeHtml(item.title)}</b>
            <small>${escapeHtml(item.text)}</small>
          </a>
        `).join("")}
      </div>

      <a class="campus-business-banner" href="/report">
        <div>
          <h4>生成你的校园合拍度报告</h4>
          <p>补全学校、兴趣和想认识的人，首页会变成更懂你的推荐入口。</p>
        </div>
        <strong>查看报告</strong>
      </a>

      <div class="campus-business-channels" aria-label="推荐频道">
        ${channels.map((label, index) => `
          <span class="campus-business-channel${index === 0 ? " is-active" : ""}">${escapeHtml(label)}</span>
        `).join("")}
      </div>

      <div class="campus-business-feed" aria-label="今日推荐内容">
        ${feed.map((item) => `
          <a class="campus-business-feed-card" href="${escapeAttr(item.href)}">
            <span class="campus-business-feed-tag">${escapeHtml(item.tag)}</span>
            <b>${escapeHtml(item.title)}</b>
            <p>${escapeHtml(item.text)}</p>
          </a>
        `).join("")}
      </div>

      <a class="campus-business-ai" href="/search.html" aria-label="打开 AI 问问">AI 问问</a>
    `;
  }

  function bindHomeBusinessModules(panel) {
    if (panel.dataset.businessBound === "true") {
      return;
    }

    panel.dataset.businessBound = "true";
    panel.addEventListener("submit", (event) => {
      const form = event.target.closest("[data-business-search]");
      if (!form) {
        return;
      }

      event.preventDefault();
      const keyword = cleanText(new FormData(form).get("keyword"));
      if (keyword) {
        sessionStorage.setItem("campus-search-keyword", keyword);
      } else {
        sessionStorage.removeItem("campus-search-keyword");
      }
      startHomeToMatchTransition({
        source: "home-business-search",
        title: "打开发现",
        text: keyword ? `正在寻找：${keyword}` : "看看今天的同频推荐",
      });
    });
  }

  function ensureProfileCompatibilityPanel() {
    if (window.location.pathname !== "/profile") {
      document.querySelector("#campus-profile-compat")?.remove();
      return;
    }

    const profileForm = document.querySelector(".campus-profile-form-card");
    if (!profileForm) {
      return;
    }

    let panel = document.querySelector("#campus-profile-compat");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "campus-profile-compat";
      panel.className = "campus-profile-compat-panel";
      profileForm.insertAdjacentElement("afterend", panel);
    }

    const renderKey = `${state.user?.mbti || ""}:${state.user?.birthDate || ""}`;
    if (panel.dataset.renderKey !== renderKey) {
      panel.dataset.renderKey = renderKey;
      panel.innerHTML = buildProfileCompatibilityPanelHtml(state.user || {});
    }

    bindProfileCompatibilityPanel(panel);
  }

  function buildProfileCompatibilityPanelHtml(user) {
    const mbti = normalizeClientMbti(user.mbti);
    const birthDate = normalizeClientBirthDate(user.birthDate || user.birthday);

    return `
      <div class="campus-profile-compat-head">
        <div>
          <h3>合拍资料</h3>
          <p>填写 MBTI 和生日后，系统会帮你生成更自然的破冰话题和校园合拍报告。</p>
        </div>
        <a class="secondary" href="/report">查看报告</a>
      </div>
      <form class="campus-profile-compat-form" data-compat-profile-form>
        <div class="campus-profile-compat-field">
          <label for="campus-mbti-select">MBTI</label>
          <select id="campus-mbti-select" name="mbti">
            <option value="">先不填写</option>
            ${MBTI_TYPES.map((type) => `<option value="${type}" ${type === mbti ? "selected" : ""}>${type}</option>`).join("")}
          </select>
        </div>
        <div class="campus-profile-compat-field">
          <label for="campus-birth-date">生日</label>
          <input id="campus-birth-date" name="birthDate" type="date" value="${escapeAttr(birthDate)}" />
        </div>
        <div class="campus-profile-compat-actions">
          <button type="submit">保存合拍资料</button>
          <a class="secondary" href="/report">生成合拍报告</a>
          <span class="campus-profile-compat-status" data-compat-status></span>
        </div>
      </form>
    `;
  }

  function bindProfileCompatibilityPanel(panel) {
    const form = panel.querySelector("[data-compat-profile-form]");
    if (!form || form.dataset.bound === "true") {
      return;
    }

    form.dataset.bound = "true";
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const status = panel.querySelector("[data-compat-status]");
      const submit = form.querySelector('button[type="submit"]');
      status?.classList.remove("is-error");
      if (status) {
        status.textContent = "正在保存...";
      }
      if (submit) {
        submit.disabled = true;
      }

      try {
        const formData = new FormData(form);
        const mbti = normalizeClientMbti(formData.get("mbti"));
        const birthDate = normalizeClientBirthDate(formData.get("birthDate"));
        const payload = await requestApi("/users/profile", {
          method: "PUT",
          body: JSON.stringify({ mbti, birthDate }),
        });
        state.user = payload.data?.user || state.user;
        panel.dataset.renderKey = `${state.user?.mbti || ""}:${state.user?.birthDate || ""}`;
        if (status) {
          status.textContent = "已保存";
        }
      } catch (error) {
        status?.classList.add("is-error");
        if (status) {
          status.textContent = error.message || "保存失败，请稍后再试";
        }
      } finally {
        if (submit) {
          submit.disabled = false;
        }
      }
    });
  }

  function ensureCompatibilityReportPage() {
    if (window.location.pathname !== "/report") {
      cleanupCompatibilityReportPage();
      return;
    }

    let page = document.querySelector("#campus-compat-report");
    if (!page) {
      page = document.createElement("main");
      page.id = "campus-compat-report";
      page.className = "campus-report-page";
      const root = document.querySelector("#root");
      if (root?.parentNode) {
        root.parentNode.insertBefore(page, root);
      } else {
        document.body.appendChild(page);
      }
    }

    const renderKey = JSON.stringify({
      id: state.user?.id || state.user?._id || state.user?.email || "",
      school: state.user?.school || state.user?.university || "",
      mbti: state.user?.mbti || "",
      birthDate: state.user?.birthDate || state.user?.birthday || "",
      score: getDailyBusinessScore(),
    });
    if (page.dataset.renderKey !== renderKey) {
      page.dataset.renderKey = renderKey;
      page.innerHTML = buildCompatibilityReportHtml(state.user || {});
    }
  }

  function cleanupCompatibilityReportPage() {
    document.querySelector("#campus-compat-report")?.remove();
  }

  function buildCompatibilityReportHtml(user) {
    const school = cleanText(user.school || user.university) || "你的学校";
    const mbti = normalizeClientMbti(user.mbti);
    const birthDate = normalizeClientBirthDate(user.birthDate || user.birthday);
    const score = getCompatibilityScore(user);
    const sign = getZodiacSign(birthDate);
    const season = getBirthSeason(birthDate);
    const mbtiTone = getMbtiTone(mbti);
    const birthLabel = birthDate ? `${formatBirthDate(birthDate)} · ${sign}` : "填写生日后生成";
    const completionTip = mbti && birthDate
      ? "资料已经够用了，接下来可以多补充兴趣、想认识的人和常去地点，让推荐更贴近真实校园生活。"
      : "去个人资料补上 MBTI 和生日，合拍报告会生成更具体的开场白、节奏建议和推荐线索。";

    return `
      <nav class="campus-report-nav" aria-label="合拍报告导航">
        <strong>校园匹配</strong>
        <div>
          <a href="/">首页</a>
          <a href="/profile">个人资料</a>
        </div>
      </nav>

      <section class="campus-report-hero">
        <div>
          <p class="campus-report-kicker">CAMPUS MATCH REPORT</p>
          <h1>校园合拍报告</h1>
          <p>根据你的学校、资料完整度、MBTI 和生日节奏，整理一份更适合当下使用的认识新朋友路线。</p>
          <div class="campus-report-chips">
            <span class="campus-report-chip">${escapeHtml(school)}</span>
            <span class="campus-report-chip">${escapeHtml(mbti || "MBTI 待填写")}</span>
            <span class="campus-report-chip">${escapeHtml(birthLabel)}</span>
            <span class="campus-report-chip">${escapeHtml(season)}</span>
          </div>
        </div>
        <div class="campus-report-score" aria-label="今日合拍度">
          <div>
            <strong>${score}</strong>
            <span>今日合拍度</span>
          </div>
        </div>
      </section>

      <section class="campus-report-grid" aria-label="合拍分析">
        <article class="campus-report-card">
          <small>同校基础</small>
          <h3>先从共同场景开始</h3>
          <p>${escapeHtml(school)} 的同学更容易从课程、图书馆、运动和活动聊起。先找共同场景，比一上来硬聊兴趣更自然。</p>
        </article>
        <article class="campus-report-card">
          <small>性格破冰</small>
          <h3>${escapeHtml(mbti || "补上 MBTI 更准确")}</h3>
          <p>${escapeHtml(mbtiTone)}</p>
        </article>
        <article class="campus-report-card">
          <small>生辰节奏</small>
          <h3>${escapeHtml(birthDate ? `${sign} · ${season}` : "生日待填写")}</h3>
          <p>${birthDate ? "可以把生日、星座和近期状态当作轻松话题，不用把它做成判断标准，重点是让开场更有温度。" : "填写生日后，这里会给你更适合当天状态的聊天节奏和话题建议。"}</p>
        </article>
      </section>

      <section class="campus-report-tips" aria-label="今日建议">
        <article class="campus-report-tip">
          <small>今日开场白</small>
          <h3>从低压力问题开始</h3>
          <p>可以试试：“你最近在学校最常去哪里？我想找一个适合学习或散步的地方。”</p>
        </article>
        <article class="campus-report-tip">
          <small>完善建议</small>
          <h3>让推荐更懂你</h3>
          <p>${escapeHtml(completionTip)}</p>
        </article>
      </section>

      <div class="campus-report-actions">
        <a href="/search.html">去发现同校同学</a>
        <a class="secondary" href="/profile">完善合拍资料</a>
      </div>
    `;
  }

  function normalizeClientMbti(value) {
    const mbti = cleanText(value).toUpperCase();
    return /^(I|E)(N|S)(F|T)(J|P)$/.test(mbti) ? mbti : "";
  }

  function normalizeClientBirthDate(value) {
    const raw = cleanText(value);
    if (!raw) {
      return "";
    }

    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return "";
    }

    const date = new Date(`${raw}T00:00:00.000Z`);
    return Number.isFinite(date.getTime())
      && date.getUTCFullYear() === Number(match[1])
      && date.getUTCMonth() + 1 === Number(match[2])
      && date.getUTCDate() === Number(match[3])
      ? raw
      : "";
  }

  function formatBirthDate(value) {
    const birthDate = normalizeClientBirthDate(value);
    if (!birthDate) {
      return "生日待填写";
    }

    return new Intl.DateTimeFormat("zh-CN", {
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${birthDate}T00:00:00.000Z`));
  }

  function getCompatibilityScore(user) {
    let score = getDailyBusinessScore();
    if (normalizeClientMbti(user?.mbti)) {
      score += 3;
    }
    if (normalizeClientBirthDate(user?.birthDate || user?.birthday)) {
      score += 3;
    }
    if (Array.isArray(user?.sceneTags) && user.sceneTags.length) {
      score += 2;
    }
    if (Array.isArray(user?.matchModes) && user.matchModes.length) {
      score += 2;
    }
    return Math.min(96, Math.max(68, score));
  }

  function getZodiacSign(value) {
    const birthDate = normalizeClientBirthDate(value);
    if (!birthDate) {
      return "星座待填写";
    }

    const [, monthText, dayText] = birthDate.match(/^\d{4}-(\d{2})-(\d{2})$/) || [];
    const month = Number(monthText);
    const day = Number(dayText);
    const signs = [
      [120, "摩羯座"],
      [219, "水瓶座"],
      [321, "双鱼座"],
      [420, "白羊座"],
      [521, "金牛座"],
      [622, "双子座"],
      [723, "巨蟹座"],
      [823, "狮子座"],
      [923, "处女座"],
      [1024, "天秤座"],
      [1123, "天蝎座"],
      [1222, "射手座"],
      [1232, "摩羯座"],
    ];
    const key = month * 100 + day;
    return signs.find(([limit]) => key < limit)?.[1] || "摩羯座";
  }

  function getBirthSeason(value) {
    const birthDate = normalizeClientBirthDate(value);
    if (!birthDate) {
      return "生日节奏待填写";
    }

    const month = Number(birthDate.slice(5, 7));
    if (month >= 3 && month <= 5) {
      return "春季节奏";
    }
    if (month >= 6 && month <= 8) {
      return "夏季节奏";
    }
    if (month >= 9 && month <= 11) {
      return "秋季节奏";
    }
    return "冬季节奏";
  }

  function getMbtiTone(type) {
    if (!type) {
      return "填写后可以生成更具体的破冰话题，比如适合直接邀约、慢慢聊天，还是先从共同任务开始。";
    }

    const energy = type[0] === "E" ? "你更适合从轻松互动和共同活动切入" : "你更适合从安静、稳定、有边界的话题切入";
    const info = type[1] === "N" ? "，可以多聊想法、计划和近期灵感" : "，可以多聊课程、生活习惯和真实场景";
    const decision = type[2] === "F" ? "，表达感受会比直接分析更容易拉近距离" : "，清楚说明想法和安排会让对方更有安全感";
    const rhythm = type[3] === "J" ? "，节奏上适合提前约好时间。" : "，节奏上适合先轻松试探，再自然推进。";
    return `${energy}${info}${decision}${rhythm}`;
  }

  function ensureLoginStory() {
    if (window.location.pathname !== "/login") {
      cleanupLoginStory();
      return;
    }

    let story = document.querySelector("#campus-login-story");
    if (!story) {
      story = document.createElement("section");
      story.id = "campus-login-story";
      story.className = "campus-login-story";
      story.innerHTML = buildLoginStoryHtml();
      document.body.insertBefore(story, document.querySelector("#root"));
    }

    story.querySelectorAll("[data-login-open]").forEach((button) => {
      if (button.dataset.bound === "true") {
        return;
      }
      button.dataset.bound = "true";
      button.addEventListener("click", () => openLoginOverlay());
    });

    const overlay = document.querySelector("#root > div");
    if (overlay && overlay.dataset.campusOverlayBound !== "true") {
      overlay.dataset.campusOverlayBound = "true";
      overlay.addEventListener("click", (event) => {
        const authCard = event.target.closest(".w-full.max-w-md");
        if (!authCard) {
          closeLoginOverlay({ restoreTop: true });
        }
      });
      overlay.addEventListener("focusin", handleAuthFocusIn);
      overlay.addEventListener("focusout", handleAuthFocusOut);
    }

    if (state.loginObserver) {
      state.loginObserver.disconnect();
    }

    const trigger = story.querySelector(".campus-login-bottom-trigger");
    if (trigger) {
      state.loginObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            openLoginOverlay();
          }
        });
      }, { threshold: .65 });
      state.loginObserver.observe(trigger);
    }

    ensureLoginMotion(story);
    ensureLoginSwipers();
  }

  function cleanupLoginStory() {
    state.loginSwipers.forEach((swiper) => {
      try {
        swiper.destroy(true, true);
      } catch {
        // Swiper may already be detached when routes change quickly.
      }
    });
    state.loginSwipers = [];
    document.querySelector("#campus-login-story")?.remove();
    delete document.body.dataset.campusLoginOverlay;
    state.loginMotionCleanup?.();
    state.loginMotionCleanup = null;
    if (state.loginObserver) {
      state.loginObserver.disconnect();
      state.loginObserver = null;
    }
    updateScrollLock();
  }

  function ensureLoginMotion(story) {
    if (!story || story.dataset.campusMotionBound === "true") {
      return;
    }

    story.dataset.campusMotionBound = "true";
    const visual = story.querySelector(".campus-login-visual");
    const coarsePointer = window.matchMedia?.("(pointer: coarse)");
    let rafId = 0;
    let tiltRafId = 0;
    let pendingTilt = null;

    const updateScrollMotion = () => {
      if (rafId) {
        return;
      }

      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const max = Math.max(1, story.scrollHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, window.scrollY / max));
        const shift = `${Math.round(progress * 42)}px`;
        const visualShift = `${Math.round(progress * -12)}px`;
        document.body.style.setProperty("--campus-login-shift", shift);
        document.body.style.setProperty("--campus-login-visual-shift", visualShift);
      });
    };

    const updateTilt = (event) => {
      if (!visual || coarsePointer?.matches) {
        return;
      }
      const rect = visual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      pendingTilt = {
        x: `${(x * 5).toFixed(2)}deg`,
        y: `${(-y * 4).toFixed(2)}deg`,
      };

      if (tiltRafId) {
        return;
      }

      tiltRafId = requestAnimationFrame(() => {
        tiltRafId = 0;
        if (!pendingTilt) {
          return;
        }

        visual.style.setProperty("--campus-tilt-x", pendingTilt.x);
        visual.style.setProperty("--campus-tilt-y", pendingTilt.y);
        pendingTilt = null;
      });
    };

    const resetTilt = () => {
      pendingTilt = null;
      cancelAnimationFrame(tiltRafId);
      tiltRafId = 0;
      visual?.style.setProperty("--campus-tilt-x", "0deg");
      visual?.style.setProperty("--campus-tilt-y", "0deg");
    };

    updateScrollMotion();
    window.addEventListener("scroll", updateScrollMotion, { passive: true });
    window.addEventListener("resize", updateScrollMotion, { passive: true });
    visual?.addEventListener("pointermove", updateTilt, { passive: true });
    visual?.addEventListener("pointerleave", resetTilt);

    state.loginMotionCleanup = () => {
      window.removeEventListener("scroll", updateScrollMotion);
      window.removeEventListener("resize", updateScrollMotion);
      visual?.removeEventListener("pointermove", updateTilt);
      visual?.removeEventListener("pointerleave", resetTilt);
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(tiltRafId);
      document.body.style.removeProperty("--campus-login-shift");
      document.body.style.removeProperty("--campus-login-visual-shift");
      visual?.style.removeProperty("--campus-tilt-x");
      visual?.style.removeProperty("--campus-tilt-y");
    };
  }

  function ensureSwiperAssets() {
    if (window.Swiper) {
      return Promise.resolve();
    }
    if (state.swiperPromise) {
      return state.swiperPromise;
    }

    state.swiperPromise = new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-campus-swiper-css="true"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css";
        link.dataset.campusSwiperCss = "true";
        document.head.appendChild(link);
      }

      const existingScript = document.querySelector('script[data-campus-swiper-js="true"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), { once: true });
        existingScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js";
      script.async = true;
      script.dataset.campusSwiperJs = "true";
      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener("error", reject, { once: true });
      document.head.appendChild(script);
    });

    return state.swiperPromise;
  }

  function ensureLoginSwipers() {
    const story = document.querySelector("#campus-login-story");
    if (!story) {
      return;
    }

    ensureSwiperAssets()
      .then(() => {
        story.querySelectorAll(".campus-story-carousel").forEach((element) => {
          if (element.swiper) {
            return;
          }

          const isPlans = element.dataset.campusSwiper === "plans";
          const swiper = new window.Swiper(element, {
            slidesPerView: 1.08,
            spaceBetween: 14,
            speed: 520,
            grabCursor: true,
            resistanceRatio: 0.78,
            roundLengths: true,
            watchOverflow: true,
            observer: true,
            observeParents: true,
            pagination: {
              el: element.querySelector(".swiper-pagination"),
              clickable: true,
            },
            breakpoints: {
              680: {
                slidesPerView: 2.05,
                spaceBetween: 16,
              },
              980: {
                slidesPerView: isPlans ? 3 : 2.45,
                spaceBetween: 16,
              },
            },
          });
          state.loginSwipers.push(swiper);
        });
      })
      .catch(() => {
        // The CSS fallback keeps the cards draggable if the CDN is unavailable.
      });
  }

  function openLoginOverlay() {
    if (window.location.pathname !== "/login") {
      return;
    }

    document.body.dataset.campusLoginOverlay = "open";
    updateScrollLock();
    setTimeout(() => {
      const emailInput = document.querySelector('input[type="email"]');
      emailInput?.focus();
    }, 60);
  }

  function handleAuthFocusIn(event) {
    const target = event.target;
    if (!target?.matches?.("input, select, textarea")) {
      return;
    }

    document.body.dataset.campusKeyboardFocus = "true";
    setTimeout(() => {
      if (document.activeElement === target) {
        scrollAuthFieldIntoView(target);
      }
    }, 120);
  }

  function scrollAuthFieldIntoView(target) {
    const card = target.closest(".w-full.max-w-md");
    if (!card) {
      target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      return;
    }

    const cardRect = card.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const idealTop = card.clientHeight * 0.38;
    const delta = targetRect.top - cardRect.top - idealTop + targetRect.height / 2;
    card.scrollTo({
      top: Math.max(0, card.scrollTop + delta),
      behavior: "smooth",
    });
  }

  function handleAuthFocusOut() {
    setTimeout(() => {
      if (!document.querySelector("#root input:focus, #root select:focus, #root textarea:focus")) {
        delete document.body.dataset.campusKeyboardFocus;
      }
    }, 160);
  }

  function closeLoginOverlay({ restoreTop = false } = {}) {
    if (document.body.dataset.campusLoginOverlay !== "open") {
      return;
    }

    delete document.body.dataset.campusLoginOverlay;
    delete document.body.dataset.campusKeyboardFocus;
    updateScrollLock();

    if (restoreTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function buildLoginStoryHtml() {
    const planCards = MEMBERSHIP_PLANS.map((plan) => `
      <article class="campus-plan-card swiper-slide">
        <span class="campus-plan-badge">${escapeHtml(plan.name)}</span>
        <h3>${escapeHtml(plan.name)}</h3>
        <p>${escapeHtml(plan.description)}</p>
        <div class="campus-plan-price">
          <strong>${plan.monthlyPrice ? `￥${plan.monthlyPrice}` : "￥0"}</strong>
          <span>${plan.monthlyPrice ? "/ 月" : "起步体验"}</span>
        </div>
        <ul class="campus-plan-features">
          ${plan.features.slice(0, 4).map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}
        </ul>
      </article>
    `).join("");

    return `
      <section class="campus-login-hero">
        <div class="campus-login-hero-copy">
          <span class="campus-login-kicker">Campus Match</span>
          <h1>只和同校、同频的人，开始一段轻松一点的认识。</h1>
          <p>先看看彼此的感觉，再决定要不要继续聊下去。把压力放低一点，把真实和安全感放前面。</p>
          <div class="campus-login-actions">
            <button class="campus-login-open" type="button" data-login-open>登录 / 注册</button>
            <a class="campus-login-secondary" href="#campus-login-bottom">先看看这里怎么玩</a>
          </div>
        </div>
        <div class="campus-login-visual">
          <div class="campus-ios-preview" aria-hidden="true">
            <div class="campus-ios-preview-card">
              <strong>今日推荐</strong>
              <span>按同校、兴趣和在线状态，为你保留更自然的开场。</span>
              <div class="campus-ios-metric-row">
                <div class="campus-ios-metric"><b>12</b><small>新推荐</small></div>
                <div class="campus-ios-metric"><b>92%</b><small>合拍度</small></div>
                <div class="campus-ios-metric"><b>3</b><small>共同兴趣</small></div>
              </div>
            </div>
            <div class="campus-ios-preview-card">
              <strong>摄影搭子</strong>
              <span>同校 · 周末有空 · 喜欢城市漫步</span>
            </div>
          </div>
          <div class="campus-login-visual-copy">
            <strong>同校优先，先聊熟，再决定要不要认识</strong>
            <p>慢慢往下滑就好，看到最后时，登录和注册会自然出现。</p>
          </div>
        </div>
      </section>

      <section class="campus-login-band">
        <div class="campus-login-strip">
          <div>
            <strong>QQ 邮箱注册</strong>
            <span>支持 QQ 邮箱接收验证码，几步就能完成注册。</span>
          </div>
          <div>
            <strong>校园认证</strong>
            <span>上传校园卡完成认证，更容易遇到真实的同校同学。</span>
          </div>
          <div>
            <strong>更多机会</strong>
            <span>从免费体验到更多曝光和筛选，按自己的节奏选择就好。</span>
          </div>
        </div>

        <div class="campus-carousel-shell">
          <div class="campus-story-carousel swiper" data-campus-swiper="intro">
            <div class="swiper-wrapper">
              <article class="campus-login-card swiper-slide">
                <h3>先轻松认识</h3>
                <p>不用一上来就交代太多，先从共同校园和相近节奏开始聊。</p>
              </article>
              <article class="campus-login-card swiper-slide">
                <h3>更像真实相遇</h3>
                <p>除了头像和一句简介，你的兴趣、认证和关系期待也会帮助彼此更快判断合不合拍。</p>
              </article>
              <article class="campus-login-card swiper-slide">
                <h3>会员更有存在感</h3>
                <p>开通后会带来更多推荐、更多展示机会和更顺手的筛选体验。</p>
              </article>
            </div>
            <div class="swiper-pagination"></div>
          </div>
        </div>

        <div class="campus-carousel-shell">
          <div class="campus-story-carousel swiper" data-campus-swiper="plans">
            <div class="swiper-wrapper">
              ${planCards}
            </div>
            <div class="swiper-pagination"></div>
          </div>
        </div>
      </section>

      <section id="campus-login-bottom" class="campus-login-bottom">
        <h2>看到这里，准备开始认识新朋友了吗？</h2>
        <p>登录后就能开始看看同校里，有没有那个让你想继续认识的人。</p>
        <div class="campus-login-actions">
          <button class="campus-login-open" type="button" data-login-open>现在开始</button>
          <span class="campus-login-secondary">几步就能完成注册</span>
        </div>
        <div class="campus-login-bottom-trigger" aria-hidden="true"></div>
      </section>
    `;
  }

  function ensureMembershipModalShell() {
    let modal = document.querySelector("#campus-membership-modal");
    if (modal) {
      return modal;
    }

    modal = document.createElement("div");
    modal.id = "campus-membership-modal";
    modal.className = "campus-membership-modal";
    modal.innerHTML = `
      <div class="campus-membership-dialog">
        <div class="campus-membership-head">
          <div>
            <h2>会员中心</h2>
            <p>看看你现在的会员权益，也可以按自己的节奏选择更适合的方案。</p>
          </div>
          <button type="button" class="campus-membership-close" data-close-membership>×</button>
        </div>
        <div class="campus-membership-body" id="campus-membership-body"></div>
      </div>
    `;
    modal.addEventListener("click", (event) => {
      if (event.target === modal || event.target.closest("[data-close-membership]")) {
        closeMembershipCenter();
      }
    });
    document.body.appendChild(modal);
    return modal;
  }

  async function openMembershipCenter() {
    ensureMembershipModalShell();
    renderMembershipModal({ loading: true });
    document.body.dataset.campusMembershipModal = "open";
    updateScrollLock();

    try {
      const payload = await requestApi("/membership");
      state.membership = normalizeMembership(payload.data?.membership || state.user?.membership);
      renderMembershipModal(payload.data || {});
      refreshProfileMembershipDecorations();
    } catch (error) {
      renderMembershipModal({
        error: error.message,
        membership: state.membership || normalizeMembership(null),
        plans: MEMBERSHIP_PLANS,
      });
    }
  }

  function closeMembershipCenter() {
    delete document.body.dataset.campusMembershipModal;
    updateScrollLock();
  }

  function renderMembershipModal(payload = {}) {
    const modal = ensureMembershipModalShell();
    const body = modal.querySelector("#campus-membership-body");
    if (!body) {
      return;
    }

    if (payload.loading) {
      body.innerHTML = `
        <div class="campus-membership-current">
          <h3>正在读取会员信息...</h3>
          <p>稍等一下，我们正在为你加载当前的会员权益。</p>
        </div>
      `;
      return;
    }

    const membership = normalizeMembership(payload.membership || state.membership);
    const plans = mergePlans(payload.plans);
    const statusLine = membership.isExpired
      ? `上一次会员已于 ${formatDate(membership.expiresAt)} 到期，当前已回到免费权益。`
      : membership.isPaid
        ? `当前权益有效期至 ${formatDate(membership.expiresAt)}。`
        : "当前为免费体验状态。";

    body.innerHTML = `
      <section class="campus-membership-current">
        <h3>${escapeHtml(membership.title || membership.badgeLabel)}</h3>
        <p>${escapeHtml(membership.description || "这是你当前的会员状态。")}</p>
        <div class="campus-membership-meta">
          <span class="campus-chip">${escapeHtml(statusLine)}</span>
          <span class="campus-chip">可浏览推荐 ${membership.limits?.recommendationWindow || 12} 位</span>
          <span class="campus-chip">${membership.isPaid ? "更多展示机会" : "基础展示权益"}</span>
        </div>
      </section>

      ${payload.error ? `<div class="campus-membership-current"><p>${escapeHtml(payload.error)}</p></div>` : ""}

      <section class="campus-membership-grid">
        ${plans.map((plan) => renderPlanCard(plan, membership)).join("")}
      </section>

      <p class="campus-membership-note">
        开通后权益会立即生效。现在可以先体验不同方案，后续也会补上正式支付方式。
      </p>
    `;

    body.querySelectorAll("[data-subscribe-plan]").forEach((button) => {
      button.addEventListener("click", async () => {
        const planId = button.getAttribute("data-subscribe-plan");
        const billingCycle = button.getAttribute("data-billing-cycle") || "monthly";
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = "处理中...";

        try {
          const payload = await requestApi("/membership/subscribe", {
            method: "POST",
            body: JSON.stringify({ planId, billingCycle }),
          });
          state.user = payload.data?.user || state.user;
          state.membership = normalizeMembership(payload.data?.membership || state.user?.membership);
          renderMembershipModal(payload.data || {});
          await refreshUser(true);
          refreshProfileMembershipDecorations();
        } catch (error) {
          button.disabled = false;
          button.textContent = error.message || originalText;
          setTimeout(() => {
            button.textContent = originalText;
          }, 1500);
        }
      });
    });
  }

  function renderPlanCard(plan, membership) {
    const isCurrentPlan = !membership.isExpired && membership.planId === plan.id;
    const badge = plan.id === "premium" ? "最高曝光" : plan.id === "plus" ? "推荐升级" : "体验版";
    const monthlyLabel = plan.monthlyPrice ? `月付 ￥${plan.monthlyPrice}` : "当前免费";
    const yearlyLabel = plan.yearlyPrice ? `年付 ￥${plan.yearlyPrice}` : "切换免费";

    return `
      <article class="campus-plan-card">
        <span class="campus-plan-badge">${escapeHtml(badge)}</span>
        <h3>${escapeHtml(plan.name)}</h3>
        <p>${escapeHtml(plan.description)}</p>
        <div class="campus-plan-price">
          <strong>${plan.monthlyPrice ? `￥${plan.monthlyPrice}` : "￥0"}</strong>
          <span>${plan.monthlyPrice ? "/ 月" : "基础版"}</span>
        </div>
        <ul class="campus-plan-features">
          ${plan.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}
        </ul>
        <div class="campus-plan-actions">
          <button
            class="primary"
            type="button"
            data-subscribe-plan="${escapeHtml(plan.id)}"
            data-billing-cycle="monthly"
            ${isCurrentPlan && (membership.billingCycle || "monthly") === "monthly" ? "disabled" : ""}
          >
            ${isCurrentPlan && (membership.billingCycle || "monthly") === "monthly" ? "当前方案" : monthlyLabel}
          </button>
          <button
            class="secondary"
            type="button"
            data-subscribe-plan="${escapeHtml(plan.id)}"
            data-billing-cycle="yearly"
            ${plan.id === "free" ? "" : ""}
          >
            ${plan.id === "free" ? yearlyLabel : yearlyLabel}
          </button>
        </div>
      </article>
    `;
  }

  function mergePlans(serverPlans) {
    if (!Array.isArray(serverPlans) || !serverPlans.length) {
      return MEMBERSHIP_PLANS;
    }

    return MEMBERSHIP_PLANS.map((localPlan) => {
      const serverPlan = serverPlans.find((item) => item.id === localPlan.id);
      return serverPlan ? { ...localPlan, ...serverPlan } : localPlan;
    });
  }

  function enhanceRegisterSchoolInput() {
    if (window.location.pathname !== "/login") {
      return;
    }

    const schools = Array.isArray(window.CAMPUS_CHINA_UNIVERSITIES)
      ? window.CAMPUS_CHINA_UNIVERSITIES
      : [];
    if (!schools.length) {
      return;
    }

    document.querySelectorAll("select").forEach((select) => {
      const firstLabel = select.options?.[0]?.textContent?.trim();
      if (firstLabel !== "选择学校") {
        return;
      }

      window.CampusUniversityOptions?.populateSelect?.(select);
      const selectWrap = select.parentElement;
      if (!selectWrap || selectWrap.parentElement?.querySelector(":scope > .campus-school-picker")) {
        return;
      }

      select.required = false;
      select.tabIndex = -1;
      select.setAttribute("aria-hidden", "true");
      selectWrap.classList.add("campus-school-native-wrap");

      const picker = document.createElement("div");
      picker.className = "campus-school-picker";
      picker.innerHTML = `
        <input
          class="apple-input campus-school-input"
          type="text"
          autocomplete="off"
          required
          role="combobox"
          aria-expanded="false"
          placeholder="输入学校名称，例如 北京大学"
        />
        <div class="campus-school-suggestions" role="listbox"></div>
        <p class="campus-school-help">输入学校名称，下面会自动筛选高校；点一下学校即可选中。</p>
      `;
      selectWrap.insertAdjacentElement("afterend", picker);

      const input = picker.querySelector("input");
      const suggestions = picker.querySelector(".campus-school-suggestions");
      let currentMatches = [];
      let activeIndex = -1;

      const closeSuggestions = () => {
        picker.classList.remove("is-open");
        input.setAttribute("aria-expanded", "false");
        activeIndex = -1;
      };

      const syncSelect = (schoolName) => {
        if (!Array.from(select.options).some((option) => option.value === schoolName)) {
          select.add(new Option(schoolName, schoolName));
        }
        select.value = schoolName;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
        input.setCustomValidity("");
      };

      const selectSchool = (school) => {
        input.value = school.name;
        syncSelect(school.name);
        closeSuggestions();
      };

      const validateTypedValue = () => {
        const value = input.value.trim();
        const exact = schools.find((school) => school.name === value);
        if (exact) {
          syncSelect(exact.name);
          return;
        }

        select.value = "";
        select.dispatchEvent(new Event("change", { bubbles: true }));
        input.setCustomValidity(value ? "请从下方高校列表中选择学校" : "请输入学校名称");
      };

      const renderSuggestions = () => {
        const query = input.value.trim();
        suggestions.innerHTML = "";

        if (!query) {
          suggestions.innerHTML = `<div class="campus-school-empty">开始输入学校名称，例如“北京”或“南京大学”。</div>`;
          picker.classList.add("is-open");
          input.setAttribute("aria-expanded", "true");
          return;
        }

        const searchSchools = window.CampusUniversityOptions?.searchSchools;
        currentMatches = typeof searchSchools === "function"
          ? searchSchools(query, 10)
          : schools
              .filter((school) => school.name.includes(query) || (school.abbr || "").includes(query.toLowerCase()))
              .slice(0, 10);

        if (!currentMatches.length) {
          suggestions.innerHTML = `<div class="campus-school-empty">暂时没有找到相关高校，换个关键词试试。</div>`;
          picker.classList.add("is-open");
          input.setAttribute("aria-expanded", "true");
          return;
        }

        currentMatches.forEach((school, index) => {
          const option = document.createElement("button");
          option.type = "button";
          option.className = "campus-school-option";
          option.setAttribute("role", "option");
          option.innerHTML = `
            <strong>${escapeHtml(school.name)}</strong>
            <span>${escapeHtml([school.province, school.city, school.level].filter(Boolean).join(" · "))}</span>
          `;
          option.addEventListener("mousedown", (event) => {
            event.preventDefault();
            selectSchool(school);
          });
          option.addEventListener("mouseenter", () => {
            activeIndex = index;
            updateActiveOption();
          });
          suggestions.appendChild(option);
        });

        picker.classList.add("is-open");
        input.setAttribute("aria-expanded", "true");
      };

      const updateActiveOption = () => {
        suggestions.querySelectorAll(".campus-school-option").forEach((option, index) => {
          option.classList.toggle("is-active", index === activeIndex);
        });
      };

      input.addEventListener("input", () => {
        validateTypedValue();
        renderSuggestions();
      });
      input.addEventListener("focus", renderSuggestions);
      input.addEventListener("blur", () => {
        validateTypedValue();
        setTimeout(closeSuggestions, 120);
      });
      input.addEventListener("keydown", (event) => {
        if (!picker.classList.contains("is-open") && (event.key === "ArrowDown" || event.key === "Enter")) {
          renderSuggestions();
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          activeIndex = Math.min(currentMatches.length - 1, activeIndex + 1);
          updateActiveOption();
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          activeIndex = Math.max(0, activeIndex - 1);
          updateActiveOption();
        } else if (event.key === "Enter" && currentMatches[activeIndex]) {
          event.preventDefault();
          selectSchool(currentMatches[activeIndex]);
        } else if (event.key === "Escape") {
          closeSuggestions();
        }
      });

      const current = select.value;
      if (current) {
        input.value = current;
        input.setCustomValidity("");
      } else {
        input.setCustomValidity("请输入学校名称");
      }
    });
  }

  function tagResponsiveRouteSections() {
    const homeHeader = document.querySelector("#root header");
    const homeHero = document.querySelector("#root h2")?.closest(".apple-card");

    if (window.location.pathname === "/") {
      homeHeader?.classList.add("campus-home-header");
      homeHero?.classList.add("campus-home-hero-card");
    } else {
      homeHeader?.classList.remove("campus-home-header");
      homeHero?.classList.remove("campus-home-hero-card");
    }

    const profileSummary = document.querySelector("#root h1")?.closest(".apple-card");
    const profileForm = document.querySelector("#root h2")?.closest(".apple-card");

    if (window.location.pathname === "/profile") {
      profileSummary?.classList.add("campus-profile-summary-card");
      profileForm?.classList.add("campus-profile-form-card");
    } else {
      profileSummary?.classList.remove("campus-profile-summary-card");
      profileForm?.classList.remove("campus-profile-form-card");
    }
  }

  function ensureProfileEnhancements() {
    if (window.location.pathname !== "/profile") {
      document.querySelector("#campus-membership-banner")?.remove();
      document.querySelector("#campus-profile-progress")?.remove();
      document.querySelector("#campus-profile-activity-center")?.remove();
      document.querySelector("#campus-privacy-panel")?.remove();
      document.querySelector("#campus-profile-compat")?.remove();
      closeAvatarSourceSheet();
      return;
    }

    const membershipButton = findMembershipButton();
    if (membershipButton && membershipButton.dataset.campusMembershipBound !== "true") {
      membershipButton.dataset.campusMembershipBound = "true";
      membershipButton.addEventListener("click", openMembershipCenter);
    }

    ensureProfileProgressPanel();
    refreshProfileMembershipDecorations();
    ensureProfileAvatarUploader();
    ensureProfileActivityActions();
    ensureProfileActivityCenter();
    ensureProfilePrivacyPanel();
    ensureProfileCompatibilityPanel();
  }

  function ensureProfileProgressPanel() {
    if (window.location.pathname !== "/profile" || !document.querySelector("#root")) {
      return;
    }

    const summaryCard = document.querySelector("#root .campus-profile-summary-card");
    if (!summaryCard || !summaryCard.parentElement) {
      return;
    }

    let panel = document.querySelector("#campus-profile-progress");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "campus-profile-progress";
      panel.className = "campus-profile-progress-panel apple-card";
    }

    if (panel.previousElementSibling !== summaryCard) {
      summaryCard.insertAdjacentElement("afterend", panel);
    }

    renderProfileProgressPanel(panel);
  }

  function renderProfileProgressPanel(panel) {
    const user = state.user || {};
    const profileReady = Boolean(user.nickname && user.bio && user.school && user.major && user.grade);
    const interestReady = Boolean(
      (Array.isArray(user.tags) && user.tags.length)
      || (Array.isArray(user.sceneTags) && user.sceneTags.length)
      || (Array.isArray(user.matchModes) && user.matchModes.length),
    );
    const verificationReady = Boolean(user.isVerified || user.verificationStatus === "approved");
    const verificationPending = user.verificationStatus === "pending";
    const checks = [
      { label: "头像", complete: Boolean(user.avatar) },
      { label: "基础资料", complete: profileReady },
      { label: "兴趣与认识方式", complete: interestReady },
      { label: "MBTI / 生辰", complete: Boolean(user.mbti && user.birthDate) },
      { label: verificationPending ? "校园认证审核中" : "校园认证", complete: verificationReady || verificationPending },
    ];
    const completed = checks.filter((item) => item.complete).length;
    const score = Math.round((completed / checks.length) * 100);
    const copy = score >= 100
      ? "你的主页已经很完整了，别人更容易判断你们是不是合拍。"
      : "补齐这些信息后，推荐会更准，别人也更容易放心开始聊天。";
    const renderKey = JSON.stringify({
      score,
      avatar: Boolean(user.avatar),
      profileReady,
      interestReady,
      mbti: user.mbti || "",
      birthDate: user.birthDate || "",
      verificationStatus: user.verificationStatus || "",
    });

    if (panel.dataset.renderKey === renderKey) {
      return;
    }

    panel.dataset.renderKey = renderKey;
    panel.style.setProperty("--campus-profile-progress", `${score}%`);
    panel.innerHTML = `
      <div class="campus-profile-progress-head">
        <div>
          <h3>我的主页准备度</h3>
          <p>${escapeHtml(copy)}</p>
        </div>
        <div class="campus-profile-progress-score">${score}%</div>
      </div>
      <div class="campus-profile-progress-bar" aria-hidden="true"><span></span></div>
      <div class="campus-profile-progress-list">
        ${checks.map((item) => `
          <div class="campus-profile-progress-item ${item.complete ? "is-complete" : ""}">
            ${escapeHtml(item.label)}
          </div>
        `).join("")}
      </div>
    `;
  }

  function ensureProfileAvatarUploader() {
    if (window.location.pathname !== "/profile" || !document.querySelector("#root")) {
      return;
    }

    const summary = document.querySelector(".campus-profile-summary-card");
    const avatarWrap = findProfileAvatarWrap(summary);
    if (!summary || !avatarWrap) {
      return;
    }

    avatarWrap.classList.add("campus-avatar-control");
    avatarWrap.querySelector(".campus-avatar-upload-prompt")?.remove();

    const cameraInput = ensureAvatarFileInput(avatarWrap, "camera");
    const galleryInput = ensureAvatarFileInput(avatarWrap, "gallery");

    for (const input of [cameraInput, galleryInput]) {
      if (input.dataset.bound !== "true") {
        input.dataset.bound = "true";
        input.addEventListener("change", handleAvatarFileSelect);
      }
    }

    const iconButton = avatarWrap.querySelector("button");
    if (iconButton) {
      iconButton.type = "button";
      iconButton.classList.add("campus-avatar-upload-trigger");
      iconButton.setAttribute("aria-label", "选择头像来源");
      iconButton.setAttribute("title", "拍照或从相册选择");
      bindAvatarUploadButton(iconButton, avatarWrap);
    }

    let status = avatarWrap.querySelector(".campus-avatar-upload-status");
    if (!status) {
      status = document.createElement("span");
      status.className = "campus-avatar-upload-status";
      status.textContent = "";
      avatarWrap.appendChild(status);
    }

    applyCampusAvatarFallbacks(avatarWrap);
  }

  function ensureAvatarFileInput(avatarWrap, source) {
    let input = avatarWrap.querySelector(`.campus-avatar-${source}-input`);
    if (!input) {
      input = document.createElement("input");
      input.className = `campus-avatar-upload-input campus-avatar-${source}-input`;
      input.type = "file";
      input.accept = "image/jpeg,image/png,image/webp,image/*";
      input.dataset.avatarSource = source;
      if (source === "camera") {
        input.setAttribute("capture", "environment");
      }
      avatarWrap.appendChild(input);
    }
    return input;
  }

  function findProfileAvatarWrap(summary) {
    if (!summary) {
      return null;
    }

    const image = summary.querySelector('img[alt*="头像"], img[src*="dicebear"]');
    return image?.closest(".relative") || image?.parentElement?.parentElement || null;
  }

  function bindAvatarUploadButton(button, avatarWrap) {
    if (!button || !avatarWrap || button.dataset.avatarUploadBound === "true") {
      return;
    }

    button.dataset.avatarUploadBound = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openAvatarSourceSheet(avatarWrap);
    });
  }

  function openAvatarSourceSheet(avatarWrap) {
    const sheet = ensureAvatarSourceSheet();
    sheet.dataset.targetAvatarId = ensureAvatarTargetId(avatarWrap);
    document.body.dataset.campusAvatarSheet = "open";
    updateScrollLock();
  }

  function closeAvatarSourceSheet() {
    delete document.body.dataset.campusAvatarSheet;
    updateScrollLock();
  }

  function ensureAvatarSourceSheet() {
    let sheet = document.querySelector("#campus-avatar-sheet");
    if (sheet) {
      return sheet;
    }

    sheet = document.createElement("div");
    sheet.id = "campus-avatar-sheet";
    sheet.className = "campus-avatar-sheet";
    sheet.innerHTML = `
      <div class="campus-avatar-sheet-panel" role="dialog" aria-modal="true" aria-label="选择头像来源">
        <div class="campus-avatar-sheet-title">
          <strong>选择头像来源</strong>
          <span>拍一张新照片，或从相册里挑一张喜欢的。</span>
        </div>
        <div class="campus-avatar-sheet-actions">
          <button class="primary" type="button" data-avatar-source="camera">拍照</button>
          <button type="button" data-avatar-source="gallery">从相册选择</button>
          <button type="button" data-avatar-source="cancel">取消</button>
        </div>
      </div>
    `;
    sheet.addEventListener("click", (event) => {
      if (event.target === sheet) {
        closeAvatarSourceSheet();
      }
    });
    sheet.querySelectorAll("[data-avatar-source]").forEach((button) => {
      button.addEventListener("click", () => {
        const source = button.dataset.avatarSource;
        if (source === "cancel") {
          closeAvatarSourceSheet();
          return;
        }

        const avatarWrap = findAvatarTarget(sheet.dataset.targetAvatarId);
        const input = avatarWrap?.querySelector(`.campus-avatar-${source}-input`);
        closeAvatarSourceSheet();
        input?.click();
      });
    });
    document.body.appendChild(sheet);
    return sheet;
  }

  function ensureAvatarTargetId(avatarWrap) {
    if (!avatarWrap.dataset.avatarTargetId) {
      avatarWrap.dataset.avatarTargetId = `avatar-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
    return avatarWrap.dataset.avatarTargetId;
  }

  function findAvatarTarget(targetId) {
    if (!targetId) {
      return null;
    }
    return document.querySelector(`.campus-avatar-control[data-avatar-target-id="${cssEscape(targetId)}"]`);
  }

  function cssEscape(value) {
    if (window.CSS?.escape) {
      return window.CSS.escape(String(value));
    }
    return String(value).replace(/["\\]/g, "\\$&");
  }

  async function handleAvatarFileSelect(event) {
    const input = event.currentTarget;
    const avatarWrap = input.closest(".campus-avatar-control");
    const summary = input.closest(".campus-profile-summary-card");
    const file = input.files?.[0];
    if (!file || !avatarWrap || !summary) {
      return;
    }

    const contentType = normalizeAvatarFileType(file);
    if (!contentType) {
      setAvatarUploadStatus(avatarWrap, "请选择 JPG、PNG 或 WebP 图片", true);
      input.value = "";
      return;
    }

    if (file.size > AVATAR_UPLOAD_MAX_BYTES) {
      setAvatarUploadStatus(avatarWrap, "图片不能超过 3MB", true);
      input.value = "";
      return;
    }

    setAvatarUploading(avatarWrap, true);
    setAvatarUploadStatus(avatarWrap, "正在更新...", false);

    try {
      const data = await readFileAsDataUrl(file);
      const payload = await requestApi("/uploads/avatar", {
        method: "POST",
        body: JSON.stringify({ contentType, data }),
      });
      const avatar = payload.data?.imageUrl || payload.data?.user?.avatar;
      if (payload.data?.user) {
        state.user = payload.data.user;
        state.membership = normalizeMembership(state.user?.membership);
      }
      updateProfileAvatarDom(summary, avatar);
      setAvatarUploadStatus(avatarWrap, "头像已更新", false);
      refreshUser(true).catch(() => {});
      setTimeout(() => {
        if (document.body.contains(avatarWrap)) {
          setAvatarUploadStatus(avatarWrap, "", false);
        }
      }, 2200);
    } catch (error) {
      setAvatarUploadStatus(avatarWrap, error.message || "头像更新失败", true);
    } finally {
      setAvatarUploading(avatarWrap, false);
      input.value = "";
    }
  }

  function normalizeAvatarFileType(file) {
    const type = String(file.type || "").split(";")[0].trim().toLowerCase();
    if (["image/jpeg", "image/png", "image/webp"].includes(type)) {
      return type;
    }

    const name = String(file.name || "").toLowerCase();
    if (/\.(jpe?g)$/.test(name)) {
      return "image/jpeg";
    }
    if (/\.png$/.test(name)) {
      return "image/png";
    }
    if (/\.webp$/.test(name)) {
      return "image/webp";
    }
    return "";
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("没有读取到图片，请重新选择"));
      reader.readAsDataURL(file);
    });
  }

  function setAvatarUploading(avatarWrap, uploading) {
    avatarWrap.dataset.avatarUploading = uploading ? "true" : "false";
    avatarWrap.querySelectorAll(".campus-avatar-upload-trigger")
      .forEach((button) => {
        button.disabled = uploading;
      });
  }

  function setAvatarUploadStatus(avatarWrap, message, isError) {
    const status = avatarWrap.querySelector(".campus-avatar-upload-status");
    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
  }

  function updateProfileAvatarDom(summary, avatar) {
    if (!avatar) {
      return;
    }

    const image = summary.querySelector(".campus-avatar-control img") || summary.querySelector('img[alt*="头像"]');
    if (image) {
      image.src = avatar;
      image.alt = "我的头像";
      image.classList.add("object-cover");
      return;
    }

    const slot = summary.querySelector(".campus-avatar-control [class*='w-24'][class*='h-24']");
    if (slot) {
      slot.innerHTML = `<img src="${escapeAttr(avatar)}" alt="我的头像" class="w-full h-full rounded-[1.5rem] bg-white/90 object-cover">`;
    }
  }

  function findMembershipButton() {
    return Array.from(document.querySelectorAll("button"))
      .find((button) => (button.textContent || "").includes("会员中心"));
  }

  function findProfileActionButton(label) {
    return Array.from(document.querySelectorAll("button"))
      .filter((button) => !button.closest("#campus-profile-activity-center"))
      .find((button) => (button.textContent || "").includes(label));
  }

  function ensureProfileActivityActions() {
    if (window.location.pathname !== "/profile" || !document.querySelector("#root")) {
      return;
    }

    const likedButton = findProfileActionButton("喜欢过的人");
    const footprintButton = findProfileActionButton("我的足迹");
    bindProfileActivityButton(likedButton, "liked");
    bindProfileActivityButton(footprintButton, "footprints");
    refreshActivitySummary().then(updateProfileActivityCounts).catch(() => {});
  }

  function bindProfileActivityButton(button, type) {
    if (!button || button.dataset.campusActivityBound === "true") {
      return;
    }

    button.dataset.campusActivityBound = "true";
    button.type = "button";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openActivityModal(type);
    });
  }

  async function refreshActivitySummary(force = false) {
    if (!currentToken()) {
      state.activitySummary = null;
      state.activityCheckedAt = 0;
      return null;
    }
    if (state.activityFetching) {
      return state.activitySummary;
    }
    if (!force && state.activitySummary && Date.now() - state.activityCheckedAt < 15000) {
      return state.activitySummary;
    }

    state.activityFetching = true;
    try {
      const payload = await requestApi("/users/activity");
      state.activitySummary = payload.data || { liked: [], footprints: [], counts: {} };
      state.activityCheckedAt = Date.now();
      updateProfileActivityCounts();
      renderProfileActivityCenter(document.querySelector("#campus-profile-activity-center"));
      return state.activitySummary;
    } finally {
      state.activityFetching = false;
    }
  }

  function updateProfileActivityCounts() {
    if (window.location.pathname !== "/profile") {
      return;
    }

    const counts = state.activitySummary?.counts || {};
    updateProfileButtonCount(findProfileActionButton("喜欢过的人"), counts.liked, "人");
    updateProfileButtonCount(findProfileActionButton("我的足迹"), counts.footprints, "条");
    renderProfileActivityCenter(document.querySelector("#campus-profile-activity-center"));
  }

  function updateProfileButtonCount(button, count, unit) {
    if (!button || !Number.isFinite(Number(count))) {
      return;
    }

    const label = `${Math.max(0, Number(count))}${unit}`;
    const leaf = Array.from(button.querySelectorAll("div, span, p"))
      .filter((node) => !node.children.length)
      .find((node) => /\d+\s*(人|条)/.test(node.textContent.trim()));
    if (leaf) {
      leaf.textContent = label;
    }
  }

  function ensureProfileActivityCenter() {
    if (window.location.pathname !== "/profile" || !document.querySelector("#root")) {
      document.querySelector("#campus-profile-activity-center")?.remove();
      return;
    }

    const anchor = document.querySelector("#campus-profile-progress")
      || document.querySelector("#root .campus-profile-summary-card");
    if (!anchor) {
      return;
    }

    let panel = document.querySelector("#campus-profile-activity-center");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "campus-profile-activity-center";
      panel.className = "campus-activity-center";
      panel.addEventListener("click", (event) => {
        const activityButton = event.target.closest("[data-open-activity]");
        if (activityButton) {
          event.preventDefault();
          openActivityModal(activityButton.dataset.openActivity);
        }
      });
    }

    if (panel.previousElementSibling !== anchor) {
      anchor.insertAdjacentElement("afterend", panel);
    }

    renderProfileActivityCenter(panel);
    refreshActivitySummary().then(() => renderProfileActivityCenter(panel)).catch(() => {});
  }

  function renderProfileActivityCenter(panel) {
    if (!panel || window.location.pathname !== "/profile") {
      return;
    }

    const summary = state.activitySummary;
    const counts = summary?.counts || {};
    const likedCount = Number(counts.liked || 0);
    const footprintCount = Number(counts.footprints || 0);
    const matchCount = Number(counts.matches || state.user?.stats?.matches || 0);
    const unreadCount = Number(counts.unread || 0);
    const latestLiked = summary?.liked?.[0]?.profile?.nickname || "去发现页表达喜欢";
    const latestFootprint = summary?.footprints?.[0]?.profile?.nickname || "略过的人会留下足迹";
    const insights = Array.isArray(summary?.insights) && summary.insights.length
      ? summary.insights
      : buildLocalActivityInsights();
    const renderKey = JSON.stringify({ likedCount, footprintCount, matchCount, unreadCount, latestLiked, latestFootprint, insights });
    if (panel.dataset.renderKey === renderKey) {
      return;
    }

    panel.dataset.renderKey = renderKey;
    panel.innerHTML = `
      <div class="campus-activity-center-head">
        <div>
          <h3>我的互动中心</h3>
          <p>这里会把你喜欢过的人、浏览足迹和合拍聊天汇总起来，推荐也会跟着这些行为变聪明。</p>
        </div>
      </div>
      <div class="campus-activity-center-grid">
        <button class="campus-activity-center-card" type="button" data-open-activity="liked">
          <strong>${likedCount}</strong>
          <span>喜欢过的人</span>
          <small>${escapeHtml(latestLiked)}</small>
        </button>
        <button class="campus-activity-center-card" type="button" data-open-activity="footprints">
          <strong>${footprintCount}</strong>
          <span>我的足迹</span>
          <small>${escapeHtml(latestFootprint)}</small>
        </button>
        <a class="campus-activity-center-card" href="/matches">
          <strong>${matchCount}</strong>
          <span>合拍聊天</span>
          <small>${unreadCount ? `${unreadCount} 条未读消息` : "去看看聊得来的人"}</small>
        </a>
      </div>
      <div class="campus-activity-center-insights">
        ${insights.slice(0, 3).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
      </div>
    `;
  }

  function buildLocalActivityInsights() {
    const user = state.user || {};
    const insights = [];
    if (user.school) {
      insights.push(`推荐会优先看 ${user.school} 的同校同学。`);
    }
    if (user.mbti || user.birthDate) {
      insights.push("填写的 MBTI 和生日会参与推荐排序。");
    }
    insights.push("多喜欢或略过几张卡片后，推荐会更贴近你的偏好。");
    return insights;
  }

  function ensureActivityModalShell() {
    let modal = document.querySelector("#campus-activity-modal");
    if (modal) {
      return modal;
    }

    modal = document.createElement("div");
    modal.id = "campus-activity-modal";
    modal.className = "campus-activity-modal";
    modal.innerHTML = `
      <div class="campus-activity-dialog" role="dialog" aria-modal="true" aria-label="我的记录">
        <div class="campus-activity-head">
          <div>
            <h2 id="campus-activity-title">我的记录</h2>
            <p id="campus-activity-subtitle">这里会显示你最近的校园互动。</p>
          </div>
          <button type="button" class="campus-activity-close" data-close-activity>×</button>
        </div>
        <div class="campus-activity-body" id="campus-activity-body"></div>
      </div>
    `;
    modal.addEventListener("click", (event) => {
      const activityButton = event.target.closest("[data-activity-action]");
      if (activityButton) {
        handleActivityAction(activityButton).catch((error) => {
          renderActivityModal(state.activityModalType, {
            error: error.message || "操作失败，请稍后再试",
            liked: [],
            footprints: [],
            counts: {},
          });
        });
        return;
      }

      if (event.target === modal || event.target.closest("[data-close-activity]")) {
        closeActivityModal();
      }
    });
    document.body.appendChild(modal);
    return modal;
  }

  async function openActivityModal(type) {
    const modal = ensureActivityModalShell();
    state.activityModalType = type;
    document.body.dataset.campusActivityModal = "open";
    updateScrollLock();
    renderActivityModal(type, { loading: true });

    try {
      const summary = await refreshActivitySummary(true);
      renderActivityModal(type, summary || {});
    } catch (error) {
      renderActivityModal(type, { error: error.message, liked: [], footprints: [], counts: {} });
    }
  }

  function closeActivityModal() {
    delete document.body.dataset.campusActivityModal;
    updateScrollLock();
  }

  async function handleActivityAction(button) {
    const action = button.dataset.activityAction;
    const targetId = button.dataset.activityTarget || "";
    let path = "";

    if (action === "dismiss-liked" && targetId) {
      path = `/users/activity/liked/${encodeURIComponent(targetId)}`;
    } else if (action === "remove-footprint" && targetId) {
      path = `/users/activity/footprints/${encodeURIComponent(targetId)}`;
    } else if (action === "clear-footprints") {
      path = "/users/activity/footprints";
    }

    if (!path) {
      return;
    }

    if (action === "clear-footprints" && !window.confirm("确定清空所有足迹吗？")) {
      return;
    }

    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = "处理中...";
    try {
      const payload = await requestApi(path, { method: "DELETE" });
      state.activitySummary = payload.data || { liked: [], footprints: [], counts: {} };
      state.activityCheckedAt = Date.now();
      updateProfileActivityCounts();
      renderProfileActivityCenter(document.querySelector("#campus-profile-activity-center"));
      renderActivityModal(state.activityModalType, state.activitySummary);
    } finally {
      if (document.body.contains(button)) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  }

  function renderActivityModal(type, summary = {}) {
    const modal = ensureActivityModalShell();
    const title = modal.querySelector("#campus-activity-title");
    const subtitle = modal.querySelector("#campus-activity-subtitle");
    const body = modal.querySelector("#campus-activity-body");
    const isLiked = type === "liked";
    title.textContent = isLiked ? "喜欢过的人" : "我的足迹";
    subtitle.textContent = isLiked
      ? "这些是你已经合拍或表达过喜欢的人。"
      : "这里记录你略过的人，想回看时不用凭记忆找。";

    if (summary.loading) {
      body.innerHTML = `<div class="campus-activity-empty">正在读取记录...</div>`;
      return;
    }

    if (summary.error) {
      body.innerHTML = `<div class="campus-activity-empty">${escapeHtml(summary.error)}</div>`;
      return;
    }

    const items = isLiked ? (summary.liked || []) : (summary.footprints || []);
    if (!items.length) {
      body.innerHTML = `<div class="campus-activity-empty">${isLiked ? "还没有喜欢过的人。去发现页多看看，也许下一张卡片就会合拍。" : "还没有足迹记录。你略过的人会出现在这里。"}</div>`;
      return;
    }

    body.innerHTML = `
      ${!isLiked ? `
        <div class="campus-activity-toolbar">
          <button class="campus-activity-danger" type="button" data-activity-action="clear-footprints">清空足迹</button>
        </div>
      ` : ""}
      <div class="campus-activity-list">
        ${items.map((item) => renderActivityItem(item, isLiked)).join("")}
      </div>
    `;
    applyCampusAvatarFallbacks(body);
  }

  function renderActivityItem(item, isLiked) {
    const profile = item.profile || {};
    const id = profile.id || profile._id || "";
    const title = profile.nickname || "同校同学";
    const meta = [profile.school, profile.major, profile.grade].filter(Boolean).join(" · ") || "资料还没完善";
    const time = item.actionAt ? formatDateTime(item.actionAt) : "最近";
    const avatar = profile.avatar
      ? `<img src="${escapeAttr(profile.avatar)}" alt="${escapeAttr(title)}" loading="lazy" />`
      : escapeHtml(String(title).slice(0, 1) || "同");
    const action = isLiked
      ? `
        <div class="campus-activity-actions">
          ${item.matchId ? `<a class="campus-activity-action" href="/chat/${escapeAttr(item.matchId)}">去聊天</a>` : ""}
          ${id ? `<button class="campus-activity-danger" type="button" data-activity-action="dismiss-liked" data-activity-target="${escapeAttr(id)}">取消喜欢</button>` : ""}
        </div>
      `
      : `
        <div class="campus-activity-actions">
          ${id ? `<a class="campus-activity-action" href="/search.html">再看看</a>` : ""}
          ${id ? `<button class="campus-activity-danger" type="button" data-activity-action="remove-footprint" data-activity-target="${escapeAttr(id)}">移除</button>` : `<span class="campus-activity-action">已记录</span>`}
        </div>
      `;

    return `
      <article class="campus-activity-card">
        <div class="campus-activity-avatar">${avatar}</div>
        <div class="campus-activity-main">
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(meta)}</span>
          <small>${escapeHtml(isLiked ? `合拍于 ${time}` : `${item.note || "浏览过"} · ${time}`)}</small>
        </div>
        ${action}
      </article>
    `;
  }

  function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "最近";
    }
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function refreshProfileMembershipDecorations() {
    if (window.location.pathname !== "/profile" || !document.querySelector("#root")) {
      return;
    }

    const membership = state.membership || normalizeMembership(state.user?.membership);
    const membershipButton = findMembershipButton();
    if (membershipButton) {
      const labelNode = findLeafNode(membershipButton, MEMBERSHIP_LABELS);
      if (labelNode) {
        labelNode.textContent = membership.badgeLabel;
      }
    }

    Array.from(document.querySelectorAll("#root div, #root p, #root span"))
      .filter((node) => !node.children.length && MEMBERSHIP_LABELS.has(node.textContent.trim()))
      .forEach((node) => {
        node.textContent = membership.badgeLabel;
      });

    const summaryCard = document.querySelector("#root .campus-profile-summary-card");
    if (!summaryCard || !summaryCard.parentElement) {
      return;
    }

    let banner = document.querySelector("#campus-membership-banner");
    if (!banner) {
      banner = document.createElement("section");
      banner.id = "campus-membership-banner";
      banner.className = "campus-membership-banner";
    }

    const anchor = document.querySelector("#campus-profile-progress") || summaryCard;
    if (banner.previousElementSibling !== anchor) {
      anchor.insertAdjacentElement("afterend", banner);
    }

    const copy = membership.isExpired
      ? `你上一次的会员已于 ${formatDate(membership.expiresAt)} 到期，目前已恢复为免费权益。`
      : membership.isPaid
        ? `${membership.badgeLabel}有效期至 ${formatDate(membership.expiresAt)}，现在可以查看更多推荐，也会拥有更高的展示机会。`
        : "先从免费体验开始也很好，想看更多推荐或提升曝光时，再开通会员就行。";

    const nextHtml = `
      <div>
        <strong>${escapeHtml(membership.badgeLabel)}</strong>
        <p>${escapeHtml(copy)}</p>
      </div>
      <button class="campus-membership-button" type="button">查看会员权益</button>
    `;

    if (banner.innerHTML !== nextHtml) {
      banner.innerHTML = nextHtml;
    }

    const manageButton = banner.querySelector("button");
    if (manageButton && manageButton.dataset.bound !== "true") {
      manageButton.dataset.bound = "true";
      manageButton.addEventListener("click", openMembershipCenter);
    }
  }

  function ensureProfilePrivacyPanel() {
    if (window.location.pathname !== "/profile" || !document.querySelector("#root")) {
      return;
    }

    const summaryCard = document.querySelector("#root .campus-profile-summary-card");
    if (!summaryCard || !summaryCard.parentElement) {
      return;
    }

    let panel = document.querySelector("#campus-privacy-panel");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "campus-privacy-panel";
      panel.className = "campus-privacy-panel apple-card";
    }

    const anchor = document.querySelector("#campus-membership-banner")
      || document.querySelector("#campus-profile-progress")
      || summaryCard;
    if (panel.previousElementSibling !== anchor) {
      anchor.insertAdjacentElement("afterend", panel);
    }

    renderPrivacyPanel(panel);
    refreshPrivacyRequests().then(() => renderPrivacyPanel(panel)).catch(() => {});
  }

  async function refreshPrivacyRequests(force = false) {
    if (!currentToken()) {
      state.privacyRequests = [];
      state.privacyCheckedAt = 0;
      return;
    }

    if (state.privacyFetching || (!force && Date.now() - state.privacyCheckedAt < 15000)) {
      return;
    }

    state.privacyFetching = true;
    try {
      const payload = await requestApi("/users/privacy-requests");
      state.privacyRequests = payload.data?.requests || [];
      state.privacyCheckedAt = Date.now();
    } finally {
      state.privacyFetching = false;
    }
  }

  function latestPrivacyRequest() {
    return [...(state.privacyRequests || [])]
      .sort((a, b) => String(b.requestedAt || "").localeCompare(String(a.requestedAt || "")))[0] || null;
  }

  function renderPrivacyPanel(panel) {
    const latest = latestPrivacyRequest();
    const pending = latest?.status === "pending";
    const locked = pending || state.privacyFetching;
    const statusText = latest
      ? `${privacyTypeLabel(latest.type)}：${privacyStatusLabel(latest.status)}${latest.requestedAt ? `，提交于 ${formatPrivacyDate(latest.requestedAt)}` : ""}${latest.notes ? `。说明：${latest.notes}` : ""}`
      : "你现在没有正在处理的申请。";
    const renderKey = JSON.stringify({
      latestId: latest?.id || "",
      latestStatus: latest?.status || "",
      latestNotes: latest?.notes || "",
      latestCancelledAt: latest?.cancelledAt || "",
      fetching: state.privacyFetching,
    });

    if (panel.dataset.renderKey !== renderKey) {
      panel.dataset.renderKey = renderKey;
      panel.innerHTML = `
        <div>
          <h3>账号与个人资料</h3>
          <p>想重新整理资料，或准备离开校园匹配时，可以在这里提交申请。处理完成前，你的资料和账号会先保留。</p>
        </div>
        <div class="campus-privacy-status">${escapeHtml(statusText)}</div>
        <textarea class="campus-privacy-reason" placeholder="可以简单说明原因（选填）"></textarea>
        <div class="campus-privacy-actions ${pending ? "has-cancel" : ""}">
          <button class="campus-privacy-button primary" type="button" data-privacy-type="delete_profile" ${locked ? "disabled" : ""}>申请清空资料</button>
          <button class="campus-privacy-button danger" type="button" data-privacy-type="delete_account" ${locked ? "disabled" : ""}>申请注销账号</button>
          ${pending ? `<button class="campus-privacy-button secondary" type="button" data-privacy-cancel="${escapeAttr(latest.id)}" ${state.privacyFetching ? "disabled" : ""}>撤回申请</button>` : ""}
        </div>
      `;
    }

    panel.querySelectorAll("[data-privacy-type]").forEach((button) => {
      if (button.dataset.bound === "true") {
        return;
      }
      button.dataset.bound = "true";
      button.addEventListener("click", () => submitPrivacyRequest(button.dataset.privacyType));
    });
    panel.querySelectorAll("[data-privacy-cancel]").forEach((button) => {
      if (button.dataset.bound === "true") {
        return;
      }
      button.dataset.bound = "true";
      button.addEventListener("click", () => cancelPrivacyRequest(button.dataset.privacyCancel));
    });
  }

  async function submitPrivacyRequest(type) {
    const panel = document.querySelector("#campus-privacy-panel");
    if (!panel || state.privacyFetching) {
      return;
    }

    if (type === "delete_account") {
      const confirmed = window.confirm("确认申请注销账号吗？处理完成后，你将无法再登录这个账号。");
      if (!confirmed) {
        return;
      }
    }

    const reason = panel.querySelector(".campus-privacy-reason")?.value || "";
    state.privacyFetching = true;
    renderPrivacyPanel(panel);

    try {
      const payload = await requestApi("/users/privacy-requests", {
        method: "POST",
        body: JSON.stringify({ type, reason }),
      });
      state.privacyRequests = payload.data?.requests || (payload.data?.request ? [payload.data.request] : []);
      state.privacyCheckedAt = Date.now();
      renderPrivacyPanel(panel);
    } catch (error) {
      panel.querySelector(".campus-privacy-status").textContent = error.message || "提交失败，请稍后再试";
    } finally {
      state.privacyFetching = false;
      renderPrivacyPanel(panel);
    }
  }

  async function cancelPrivacyRequest(requestId) {
    const panel = document.querySelector("#campus-privacy-panel");
    if (!panel || state.privacyFetching || !requestId) {
      return;
    }

    const confirmed = window.confirm("确认撤回这条申请吗？撤回后可以重新提交。");
    if (!confirmed) {
      return;
    }

    state.privacyFetching = true;
    renderPrivacyPanel(panel);

    try {
      const payload = await requestApi("/users/privacy-requests/cancel", {
        method: "POST",
        body: JSON.stringify({ requestId }),
      });
      state.privacyRequests = payload.data?.requests || (payload.data?.request ? [payload.data.request] : []);
      state.privacyCheckedAt = Date.now();
      renderPrivacyPanel(panel);
    } catch (error) {
      panel.querySelector(".campus-privacy-status").textContent = error.message || "撤回失败，请稍后再试";
    } finally {
      state.privacyFetching = false;
      renderPrivacyPanel(panel);
    }
  }

  function privacyTypeLabel(type) {
    return type === "delete_account" ? "注销账号" : "删除资料";
  }

  function privacyStatusLabel(status) {
    return {
      pending: "待处理",
      completed: "已完成",
      rejected: "已驳回",
      cancelled: "已撤回",
    }[status] || "待处理";
  }

  function formatPrivacyDate(value) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString("zh-CN") : "未知时间";
  }

  function findLeafNode(root, acceptedValues) {
    return Array.from(root.querySelectorAll("div, p, span"))
      .find((node) => !node.children.length && acceptedValues.has(node.textContent.trim()));
  }

  async function enhance() {
    setRouteState();
    ensureSplineScene();
    ensureQuickActions();
    enhanceAuthPage();
    ensureLegalLinksAndConsent();
    ensureLoginStory();
    await refreshUser();
    ensureCompatibilityReportPage();
    tagResponsiveRouteSections();
    ensureHomeBusinessModules();
    ensureProfileEnhancements();
    window.CampusUniversityOptions?.populateSelects?.(document);
    enhanceRegisterSchoolInput();
    rewriteAudienceCopy();
    ensureUnreadPolling();
    syncUnreadIndicators(state.unreadMatches, state.unreadTotal);
    ensureChatTools();
    enhanceChatTimeline();
  }

  const observer = new MutationObserver(() => {
    setRouteState();
    guardAdminRoute();
    queueEnhance();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  setInterval(() => {
    if (state.token !== currentToken()) {
      refreshUser(true).catch(() => {
        // Retry on next interval.
      });
    }
  }, 1500);

  enhance().catch(() => {
    // Initial enhance failures should not break the page.
  });
})();
