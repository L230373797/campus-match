# 校园匹配线上验收清单

最后更新：2026-05-05

## 一键检查

上线前先跑本地核心流程：

```bash
npm run check:launch
```

这个脚本使用临时本地数据，不会改动线上用户数据。报告会写入：

```text
output/launch-smoke-test-report.json
```

部署后再跑线上低风险检查：

```bash
npm run check:production:acceptance
```

这个脚本只检查页面、静态资源、健康接口和未登录保护，不注册用户，也不写线上数据。报告会写入：

```text
output/production-acceptance-report.json
```

需要同时保留本地和线上报告时，可以指定报告文件：

```bash
node scripts/production-acceptance-check.mjs --base-url http://127.0.0.1:3199 --report output/production-acceptance-local-report.json
node scripts/production-acceptance-check.mjs --base-url https://campus-match-sansui.netlify.app --report output/production-acceptance-online-report.json
```

生产 MySQL 检查必须使用真实云数据库配置：

```bash
npm run check:mysql:production
```

如只想验证本机 MySQL 表结构和读写适配，可显式运行：

```bash
node scripts/check-production-mysql.mjs --allow-local
```

## 校园内测 P0 收口

- 用户端不露出真实付费承诺，会员相关文案只作为内测权益展示。
- 首页、测试中心、报告历史、测友讨论、推荐匹配、消息、我的页需要在手机尺寸走完一遍。
- 20 个 5 题短测都能选择、完成、保存，最近报告会写入画像标签和推荐标签。
- 测友讨论、树洞、聊天文本均有关键词安全检查；测友讨论和聊天消息支持举报，累计举报会自动隐藏。
- 管理后台数据看板需要关注认证待审、账号资料请求、测友讨论复核、树洞复核、聊天举报。
- 生产环境必须确认 MySQL、SMTP、管理员账号、HTTPS、上传图片读取和隐私/协议页面都可用。

## 当前线上地址

- 用户端：https://campus-match-sansui.netlify.app
- 管理端：https://campus-match-sansui.netlify.app/admin.html
- 隐私政策：https://campus-match-sansui.netlify.app/privacy
- 用户协议：https://campus-match-sansui.netlify.app/terms
- 健康接口：https://campus-match-sansui.netlify.app/api/health

## 自动检查覆盖

- 首页、登录页、资料页、上传页、搜索页、管理端页面可以打开。
- 隐私政策和用户协议可以打开。
- 入口 HTML 引用的 JS/CSS 静态资源可以正常加载。
- `/api/health` 返回正常状态。
- 未登录访问用户资料接口会被拒绝。
- 管理端静态脚本可以正常加载。

## 人工验收项

- QQ 邮箱可以收到验证码，验证码能完成注册。
- 注册时必须勾选用户协议和隐私政策。
- 登录、退出登录都能回到正确页面。
- 头像可以点击右下角相机按钮，从拍照或相册选择图片。
- 上传头像后，头像能立刻显示，刷新后仍然保留。
- 资料编辑里的学校输入和高校筛选顺手，没有遮挡。
- MBTI、生辰、标签、匹配偏好能保存并回显。
- 首页和各页面动态背景流畅，手机端不卡顿。
- 手机端聊天页键盘弹起后，输入框和消息列表不遮挡。
- 匹配卡片滑动、喜欢、略过、回退操作正常。
- 匹配成功后能进入对应聊天。
- 聊天消息能发送、显示时间分组、未读清零。
- 图片消息上传后能显示。
- 删除/撤回消息行为符合预期。
- 用户可以提交账号资料处理请求，也可以撤回。
- 管理员端可以查看用户、匹配、消息概览。
- 管理员端可以处理校园认证和隐私请求。

## 上线前业务确认

- 线上数据库、备份、导出流程确认清楚。
- 管理员账号和普通用户账号权限隔离。
- 邮件发送额度、频率限制和备用邮箱确认清楚。
- 隐私政策、用户协议里的主体信息后续按真实运营主体补齐。
- 用户举报、封禁、内容处理流程后续补齐。

## 本轮验收记录

2026-05-04：

- 已完成 GitHub `netlify-current-source` 分支同步。
- 已完成 Netlify 生产部署。
- 已新增线上验收脚本。
- 下一步重点：真实账号跑完整用户流程和管理端人工验收。

2026-05-05：

- 本地核心流程 `npm run check:launch` 通过，覆盖注册、登录、资料、测试、测友讨论、上传、认证、匹配、聊天、后台和隐私请求。
- 本地生产验收通过，报告见 `output/production-acceptance-local-report.json`。
- 390px 移动端截图已输出到 `output/internal-beta-acceptance/`，覆盖首页、测试中心、消息、我的和登录页。
- 线上站点当前阻塞：Netlify 返回 `503 usage_exceeded`，所有线上页面和接口暂不可用；需先处理 Netlify 用量/套餐/站点额度。
- 生产 MySQL 当前阻塞：缺少 `.env.production-mysql` 云数据库配置；`npm run check:mysql:production` 会拒绝使用 `.env.local` 作为生产库。
- 本机 MySQL 适配检查可用：`node scripts/check-production-mysql.mjs --allow-local` 通过，但不代表线上 Netlify 已接入云数据库。
