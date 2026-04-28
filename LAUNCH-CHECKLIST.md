# 校园匹配上线前检查清单

最后更新：2026-04-28

## 一键冒烟检查

每次上线前先运行：

```bash
npm run check:launch
```

这个脚本使用临时本地数据，不会改动线上用户数据。检查报告会写入：

```text
output/launch-smoke-test-report.json
```

当前自动覆盖的核心流程：

- 健康检查接口 `/api/health`
- QQ 邮箱账号注册和登录
- 我的资料读取与保存
- 头像上传与资料持久化
- 会员权益读取与开通
- 校园卡上传
- 运营后台通过校园认证
- 推荐列表、喜欢、匹配列表
- 聊天消息发送、读取、互相展示身份申请
- 账号资料请求提交、撤回、运营后台驳回

## 代码检查

上线前至少跑一遍：

```bash
node --check netlify/functions/api.mjs
node --check public/app-enhance.js
node --check public/admin.js
node --check public/campus-spline-scene.js
node --check server/index.mjs
node --check scripts/launch-smoke-test.mjs
```

## 线上基础检查

部署后确认这些页面能正常打开：

- `/`
- `/login`
- `/profile`
- `/search.html`
- `/upload.html`
- `/admin.html`
- `/privacy`
- `/terms`

确认接口：

```bash
https://campus-match-sansui.netlify.app/api/health
```

应该返回 `ok`。

## 人工检查项

这些需要真实浏览器或真实账号确认：

- QQ 邮箱验证码能收到，验证码可完成注册。
- 手机端登录页滑到底部能弹出登录注册界面。
- 手机端动态背景流畅，重力感应没有明显卡顿。
- 资料页按钮、文字、输入框在窄屏下不遮挡。
- 资料页头像可拍照或从相册选择，上传后头像能立即显示。
- 上传校园卡页面可选择真实图片，并能在资料页看到状态变化。
- 运营后台真实管理员账号可以登录、刷新队列、处理认证和账号资料请求。
- 匹配卡片左右滑动、回退、喜欢、略过操作顺手。
- 聊天页消息发送、未读提示、互相展示身份文案正常。
- 退出登录后能回到登录页，不会卡在无响应状态。

运营后台的具体操作说明见：

```text
OPERATOR-GUIDE.md
```

## 上线前业务确认

- 隐私政策和用户协议已经放在 `/privacy`、`/terms`。
- 注册页勾选用户协议和隐私政策后才能创建账号。
- 用户可以提交、撤回账号资料请求。
- 运营后台可单独处理认证队列和账号资料请求。
- 邮件发送目前依赖 QQ 邮箱 SMTP，正式大规模使用前要确认发送额度、风控和备用邮箱。
- 数据当前由配置的数据源保存，正式运营前要确认备份、导出和管理员权限。

## 本次检查记录

2026-04-28 本地冒烟检查：通过。

通过项：

- `npm run check:launch`
- `node --check` 主要 JS 文件
- 线上 `/api/health`
- 线上主要页面 HTTP 200

本次未自动覆盖：

- 真实 QQ 邮箱验证码收信
- 真实手机重力感应和滑动手感
- 真实管理员账号人工审核体验
