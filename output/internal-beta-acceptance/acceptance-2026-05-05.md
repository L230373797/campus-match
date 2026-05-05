# 校园内测上线验收记录 2026-05-05

## 自动验收

- 通过：`npm run check:launch`
- 通过：`node scripts/production-acceptance-check.mjs --base-url http://127.0.0.1:3199 --report output/production-acceptance-local-report.json`
- 通过：`node scripts/check-production-mysql.mjs --allow-local`
- 阻塞：`node scripts/production-acceptance-check.mjs --base-url https://campus-match-sansui.netlify.app --report output/production-acceptance-online-report.json`
- 阻塞：`npm run check:mysql:production`

## 阻塞项

- P0：线上 Netlify 返回 `503 usage_exceeded`，用户端、管理端、隐私协议页和 `/api/health` 均不可用。
- P0：缺少 `.env.production-mysql` 真实云数据库配置；生产 MySQL 检查已禁止误用 `.env.local`。
- P1：真实手机、真实邮箱验证码、真实管理员/学生账号仍需人工跑完。

## 已确认可用

- 本地核心主链路通过：注册、登录、资料、测试报告、测友讨论、树洞、上传、校园认证、推荐匹配、聊天、后台处理和隐私请求。
- 本地生产静态资源、页面入口、健康接口和未登录保护通过。
- 本机 MySQL 表结构和数据适配通过，但这只是本地验证。
- 390px 移动端截图已覆盖：首页、测试中心、消息、我的、登录。

## 截图

- `output/internal-beta-acceptance/mobile-home-390.png`
- `output/internal-beta-acceptance/mobile-tests-390.png`
- `output/internal-beta-acceptance/mobile-messages-390.png`
- `output/internal-beta-acceptance/mobile-profile-390.png`
- `output/internal-beta-acceptance/mobile-login-390.png`

## 上线前动作

- 处理 Netlify `usage_exceeded`：升级/恢复额度或迁移到可用站点后重跑线上验收。
- 从 `deploy/netlify-mysql.env.example` 复制 `.env.production-mysql`，填入真实云 MySQL，再把同一组变量配置到 Netlify。
- 使用真实管理员账号和两个真实学生账号，完成用户端、后台、举报和审核人工验收。
- 用至少一台真实手机完成注册、上传头像/图片、聊天键盘、测试报告和底部导航验收。
