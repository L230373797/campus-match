# 校园匹配项目交接说明

这份文档给接手开发的人使用。仓库里不要提交真实密码、SMTP 授权码、MySQL root 密码、Netlify Token 或任何生产环境密钥。

## 当前项目状态

- 前端：React + Vite，主要代码在 `react-src/src`。
- 后端：Node.js 独立服务，入口是 `server/index.mjs`。
- 数据库：本地 MySQL，库名建议为 `campus_match`。
- 线上前端：`https://campus-match-sansui.netlify.app`
- 本地前端常用地址：`http://127.0.0.1:3138/`
- 本地后端常用地址：`http://127.0.0.1:3000/`

## 本地启动

先在项目根目录安装后端依赖：

```bash
npm install
```

启动本地后端：

```bash
npm run standalone
```

再进入前端目录安装并启动：

```bash
cd react-src
npm install
npm run dev -- --host 127.0.0.1 --port 3138
```

当前 `react-src/vite.config.js` 已把 `/api` 代理到 `http://127.0.0.1:3000`，所以本地调试时建议同时启动前端和独立后端。

## 数据库

MySQL 初始化脚本：

```text
db/mysql/schema.sql
```

Windows 桌面辅助脚本：

```text
scripts/windows/setup-mysql-user-desktop.ps1
scripts/windows/start-local-mysql-site.ps1
scripts/windows/open-mysql-viewer.ps1
scripts/windows/backup-mysql-desktop.ps1
scripts/windows/sync-mysql-desktop.ps1
```

交接时需要单独提供：

- MySQL 主机、端口、库名、用户名。
- MySQL 用户密码，私下发送，不写进仓库。
- 是否使用本地 MySQL Workbench 或其他可视化工具。

## 环境变量

参考 `.env.example` 创建本地 `.env.local`。接手人需要你私下提供这些真实值：

- `MYSQL_PASSWORD`
- `QQ_SMTP_AUTH_CODE`
- `CAMPUS_ADMIN_PASSWORD`
- 如部署后端，还需要服务器上的同名环境变量。

不要把 `.env.local` 发到公开仓库。

## 当前已做功能

- QQ 邮箱验证码注册/登录。
- 用户资料、学校、头像、兴趣标签、MBTI、生辰等资料字段。
- 首页动态视觉背景、滚动文字、移动端适配。
- 头像点击右下角相机，可拍照或从相册选择。
- 会员系统前端入口和部分后端接口。
- 推荐、喜欢、匹配、消息页的前后端对接。
- 树洞/倾诉模块。
- “测一测”横向分页小测试：MBTI、生辰、关系目标、场景偏好、回应方式和安全边界。
- 小测试结果可保存到用户画像，并影响首页画像/推荐展示。
- 管理员审核逻辑已从用户端拆出思路，后续建议单独做管理端页面。

## 最近一轮改动重点

- 修复首页滚动被导航 `scrollIntoView()` 吸回顶部的问题。
- 测一测横滑释放后会自动吸附到最近一页。
- 测一测支持左右方向键切换。
- 横向滑动区域里的纵向鼠标滚轮会继续滚动页面。
- 测一测结果页新增开场指数、选项状态、重测入口和更清楚的保存反馈。

## 接手人优先看这些文件

```text
react-src/src/App.jsx
react-src/src/App.css
react-src/src/PillNav.jsx
react-src/src/ScrollReveal.jsx
server/index.mjs
db/mysql/schema.sql
netlify.toml
.env.example
```

## 建议下一步

1. 先跑 `npm run lint` 和 `npm run build`，确认前端没报错。
2. 用本地 MySQL 跑完整注册、登录、保存画像、喜欢/匹配、消息流程。
3. 把管理员端单独做成 `/admin` 或独立站点，不要再放在用户端页面里。
4. 后端部署前，确认 SMTP、数据库、CORS、Netlify 环境变量都已经分环境配置。
5. 上线前把测试账号、测试数据、调试开关整理干净。

## 分支交接方式

建议交接分支名：

```text
handoff/partner-2026-05-03
```

给接手人时提供：

- GitHub 仓库地址和分支名。
- 这份 `HANDOFF.md`。
- `.env.example`，以及私下发送的真实环境变量。
- MySQL 初始化脚本或数据库备份。
- Netlify 站点、后端服务器、数据库可视化工具的账号权限。

