# 校园匹配项目交接说明

最后更新：2026-05-05

这份文档给接手开发和运营的人使用。仓库里不要提交真实密码、SMTP 授权码、MySQL 密码、Netlify Token、用户真实证件/校园卡原图或任何生产密钥。

## 当前状态

- 产品定位：校园社交增强，核心是校园认证、推荐匹配、聊天、树洞、测试中心、深度报告和测友讨论。
- 前端：React + Vite，主要代码在 `react-src/src/App.jsx` 和 `react-src/src/App.css`。
- 后端：Netlify Functions，主要入口是 `netlify/functions/api.mjs`；本地也可用 `npm run standalone` 跑独立服务。
- 数据：本地 MySQL 已可用；生产云 MySQL 还未配置完成。
- 当前本地验收地址：`http://127.0.0.1:3199`
- 当前线上地址：`https://campus-match-sansui.netlify.app`

## 已完成能力

- 用户注册、登录、改密码、资料编辑、头像/照片上传。
- 校园认证上传、管理员审核、认证状态回显。
- 首页推荐、喜欢/略过、匹配成功、聊天、图片消息、撤回/删除、聊天举报。
- 树洞发布、关键词安全、举报和后台处理。
- 测试中心：每日一测、20 个短测、深度报告、历史报告、报告保存、画像标签联动。
- 测友讨论：匿名/署名发帖、回复、共鸣、举报、自动隐藏、后台审核。
- 管理后台：概览、校园认证、用户管理、账号资料请求、测友讨论/树洞/聊天举报处理。
- 移动端 UI 已按深色玻璃风格收口，390px 截图已验收。

## 当前阻塞项

- P0：Netlify 线上站点返回 `503 usage_exceeded`，需要处理 Netlify 用量、额度或套餐后才能继续线上验收。
- P0：缺少真实云 MySQL 配置 `.env.production-mysql`；生产检查不会再允许用 `.env.local` 冒充生产库。
- P1：真实手机、真实邮箱验证码、真实管理员/学生账号仍需人工完整跑一遍。

## 本地启动

根目录安装依赖：

```powershell
npm install
```

启动本地独立服务：

```powershell
npm run standalone
```

或者使用现有本地验收地址：

```text
http://127.0.0.1:3199
```

前端源码构建：

```powershell
cd react-src
npm install
npm run lint
npm run build
```

构建后的 `react-src/dist` 需要同步到根目录 `public` 才会进入 Netlify 静态部署包。

## 环境变量

参考 `.env.example` 创建本地 `.env.local`。真实值私下交接，不要提交。

本地常用变量：

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `CAMPUS_ADMIN_EMAILS`
- `CAMPUS_ADMIN_EMAIL`
- `CAMPUS_ADMIN_PASSWORD`
- `EMAIL_VERIFICATION_DEBUG`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_FROM`
- `QQ_SMTP_USER`
- `QQ_SMTP_AUTH_CODE`

云 MySQL 配置参考：

```text
deploy/netlify-mysql.env.example
```

复制后填写真实云数据库：

```powershell
Copy-Item deploy/netlify-mysql.env.example .env.production-mysql
```

## 验收命令

本地核心流程：

```powershell
npm run check:launch
```

本地生产入口检查：

```powershell
node scripts/production-acceptance-check.mjs --base-url http://127.0.0.1:3199 --report output/production-acceptance-local-report.json
```

线上低风险检查：

```powershell
node scripts/production-acceptance-check.mjs --base-url https://campus-match-sansui.netlify.app --report output/production-acceptance-online-report.json
```

本机 MySQL 适配检查：

```powershell
node scripts/check-production-mysql.mjs --allow-local
```

真实云 MySQL 检查：

```powershell
npm run check:mysql:production -- --env .env.production-mysql
npm run check:mysql:production -- --env .env.production-mysql --write-test
```

## 上线步骤

1. 先解决 Netlify `usage_exceeded`，确保线上页面能返回 200。
2. 创建真实云 MySQL，填写 `.env.production-mysql`。
3. 跑云 MySQL 检查和写入测试。
4. 把 `MYSQL_*` 环境变量配置到 Netlify production context。
5. 重新部署 Netlify。
6. 跑线上验收脚本。
7. 用真实管理员账号和两个学生账号人工验收注册、认证、测试、匹配、聊天、举报和后台处理。

## 交接文件

优先阅读：

- `LAUNCH-CHECKLIST.md`
- `OPERATOR-GUIDE.md`
- `deploy/README-netlify-mysql.md`
- `deploy/README-server.md`
- `README-standalone.md`
- `netlify/functions/api.mjs`
- `react-src/src/App.jsx`
- `react-src/src/App.css`
- `scripts/launch-smoke-test.mjs`
- `scripts/production-acceptance-check.mjs`
- `scripts/check-production-mysql.mjs`

本轮验收产物：

- `output/internal-beta-acceptance/acceptance-2026-05-05.md`
- `output/internal-beta-acceptance/mobile-home-390.png`
- `output/internal-beta-acceptance/mobile-tests-390.png`
- `output/internal-beta-acceptance/mobile-messages-390.png`
- `output/internal-beta-acceptance/mobile-profile-390.png`
- `output/internal-beta-acceptance/mobile-login-390.png`
- `output/production-acceptance-local-report.json`
- `output/production-acceptance-online-report.json`

## 不要提交

- `.env.local`
- `.env.production-mysql`
- 任何真实数据库密码、SMTP 授权码、Netlify Token
- 用户真实校园卡、头像原图和生产数据导出
- `node_modules/`
- `.netlify/`
- 本地日志和临时调试输出
