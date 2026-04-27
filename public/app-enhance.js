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
  const AUDIENCE_COPY_REPLACEMENTS = new Map([
    ["像 Apple 一样轻盈顺滑地开始一段校园连接。", "轻松一点，认识更合拍的同校新朋友。"],
    ["保持业务逻辑不变，只把资料编辑区做成更统一的 Apple 风格。", "在这里完善你的资料，会更容易遇到合适的同校同学。"],
    ["用于后续线下闭环与真实连接", "聊得合适时，也愿意进一步线下见面"],
    ["校园认证与资料完善", "校园认证"],
    ["先完善档案并提交校园卡信息，再发起校园认证。", "完善资料并上传校园卡后，我们会尽快帮你完成校园认证。"],
    ["校园卡图片地址", "校园卡照片"],
    ["填写校园卡图片 URL，用于认证审核", "上传校园卡后会自动更新"],
    ["提交认证申请", "去上传校园卡"],
    ["找同校、同频、低压力的真实连接", "看看今天和你合拍的同校同学"],
    ["搜索活动、圈子、同学...", "搜索同学、兴趣或想一起做的事"],
    ["同校优先推荐", "同校同学"],
    ["你们互相喜欢了对方，开始聊天吧", "互相感兴趣后，就从一句轻松的问候开始吧"],
    ["还没有匹配", "还没有新的匹配"],
    ["去首页多滑动卡片，找到互相喜欢的人吧。", "多看看推荐，也许下一个就是聊得来的人。"],
    ["去发现", "去看看推荐"],
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
  };

  injectStyles();
  patchFetch();
  patchHistoryMethod("pushState");
  patchHistoryMethod("replaceState");

  window.addEventListener("popstate", queueEnhance);
  document.addEventListener("keydown", handleGlobalKeydown);

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      body:not([data-campus-admin="true"]) a[href="/admin/verification"] { display: none !important; }
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
      .campus-code-panel button:disabled { opacity: .55; cursor: not-allowed; }
      .campus-code-message { grid-column: 1 / -1; min-height: 18px; color: rgba(255,255,255,.66); font-size: 12px; padding-left: 4px; }
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
        min-height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        background: rgba(255,255,255,.1);
        color: rgba(255,255,255,.82);
        font-size: 12px;
        font-weight: 700;
        margin-bottom: 14px;
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

      @media (max-width: 900px) {
        .campus-login-hero,
        .campus-login-grid,
        .campus-membership-grid {
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
        transition: transform .35s cubic-bezier(.2, 1, .22, 1), box-shadow .35s ease;
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
        transition: transform .52s cubic-bezier(.18, 1.16, .22, 1), opacity .28s ease;
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
        transition: transform .18s cubic-bezier(.2, 1, .22, 1), filter .18s ease;
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
      return originalFetch(input, init);
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

  function setRouteState() {
    document.body.dataset.campusRoute = window.location.pathname;
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

  async function refreshUser(force = false) {
    const token = currentToken();
    if (!token) {
      state.token = "";
      state.user = null;
      state.membership = normalizeMembership(null);
      document.body.dataset.campusAuthenticated = "false";
      document.body.dataset.campusAdmin = "false";
      document.body.dataset.campusMembership = "free";
      guardAdminRoute();
      refreshProfileMembershipDecorations();
      return;
    }

    if (!force && state.token === token && Date.now() - state.checkedAt < 10000) {
      return;
    }

    state.token = token;
    state.checkedAt = Date.now();

    try {
      const payload = await requestApi("/auth/me");
      state.user = payload.data?.user || null;
      state.membership = normalizeMembership(state.user?.membership);
      document.body.dataset.campusAuthenticated = "true";
      document.body.dataset.campusAdmin = state.user?.isAdmin ? "true" : "false";
      document.body.dataset.campusMembership = state.membership.planId;
    } catch {
      state.user = null;
      state.membership = normalizeMembership(null);
      document.body.dataset.campusAuthenticated = "false";
      document.body.dataset.campusAdmin = "false";
      document.body.dataset.campusMembership = "free";
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
      || document.body.dataset.campusMembershipModal === "open";
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

    if (document.body.dataset.campusLoginOverlay === "open") {
      closeLoginOverlay({ restoreTop: true });
    }
  }

  function guardAdminRoute() {
    if (window.location.pathname !== "/admin/verification") {
      return;
    }

    if (!currentToken()) {
      history.replaceState(null, "", "/login");
      queueEnhance();
      return;
    }

    if (state.checkedAt && document.body.dataset.campusAdmin !== "true") {
      history.replaceState(null, "", "/profile");
      queueEnhance();
    }
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
    let rafId = 0;

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
      if (!visual || window.matchMedia("(pointer: coarse)").matches) {
        return;
      }
      const rect = visual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      visual.style.setProperty("--campus-tilt-x", `${(x * 5).toFixed(2)}deg`);
      visual.style.setProperty("--campus-tilt-y", `${(-y * 4).toFixed(2)}deg`);
    };

    const resetTilt = () => {
      visual?.style.setProperty("--campus-tilt-x", "0deg");
      visual?.style.setProperty("--campus-tilt-y", "0deg");
    };

    updateScrollMotion();
    window.addEventListener("scroll", updateScrollMotion, { passive: true });
    window.addEventListener("resize", updateScrollMotion, { passive: true });
    visual?.addEventListener("pointermove", updateTilt);
    visual?.addEventListener("pointerleave", resetTilt);

    state.loginMotionCleanup = () => {
      window.removeEventListener("scroll", updateScrollMotion);
      window.removeEventListener("resize", updateScrollMotion);
      visual?.removeEventListener("pointermove", updateTilt);
      visual?.removeEventListener("pointerleave", resetTilt);
      cancelAnimationFrame(rafId);
      document.body.style.removeProperty("--campus-login-shift");
      document.body.style.removeProperty("--campus-login-visual-shift");
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

  function closeLoginOverlay({ restoreTop = false } = {}) {
    if (document.body.dataset.campusLoginOverlay !== "open") {
      return;
    }

    delete document.body.dataset.campusLoginOverlay;
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
      return;
    }

    const membershipButton = findMembershipButton();
    if (membershipButton && membershipButton.dataset.campusMembershipBound !== "true") {
      membershipButton.dataset.campusMembershipBound = "true";
      membershipButton.addEventListener("click", openMembershipCenter);
    }

    refreshProfileMembershipDecorations();
  }

  function findMembershipButton() {
    return Array.from(document.querySelectorAll("button"))
      .find((button) => (button.textContent || "").includes("会员中心"));
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

    const firstCard = document.querySelector("#root .apple-card");
    if (!firstCard || !firstCard.parentElement) {
      return;
    }

    let banner = document.querySelector("#campus-membership-banner");
    if (!banner) {
      banner = document.createElement("section");
      banner.id = "campus-membership-banner";
      banner.className = "campus-membership-banner";
      firstCard.insertAdjacentElement("afterend", banner);
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

  function findLeafNode(root, acceptedValues) {
    return Array.from(root.querySelectorAll("div, p, span"))
      .find((node) => !node.children.length && acceptedValues.has(node.textContent.trim()));
  }

  async function enhance() {
    setRouteState();
    ensureQuickActions();
    enhanceAuthPage();
    ensureLoginStory();
    await refreshUser();
    tagResponsiveRouteSections();
    ensureProfileEnhancements();
    rewriteAudienceCopy();
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
