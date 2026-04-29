# Netlify 生产环境切换到云 MySQL

这份流程用于以后把线上 Netlify 后端从 Netlify Blobs 切到云 MySQL / RDS。现在代码已经支持：只要生产环境存在完整的 `MYSQL_*` 环境变量，后端会优先使用 MySQL；图片上传仍然继续保存在 Netlify Blobs。

## 1. 云数据库要求

- MySQL 8.x
- 字符集使用 `utf8mb4`
- 数据库名建议：`campus_match`
- 用户建议：`campus_app`
- 需要允许 Netlify Functions 访问数据库公网地址
- 如果数据库服务商要求 TLS，开启 `MYSQL_SSL=true`

注意：Netlify Functions 的出口 IP 通常不是固定的。云数据库如果必须按 IP 白名单放行，最稳的长期方案是把后端迁到自己的云服务器或使用带固定出口的网络方案。不要随便裸开数据库公网访问；如果短期测试必须开放公网入口，也要开启 TLS、使用强密码、只给最小权限账号，并在测试后收紧安全组。

## 2. 创建数据库和用户

在云数据库控制台或 SQL 客户端里执行：

```sql
CREATE DATABASE IF NOT EXISTS campus_match
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'campus_app'@'%' IDENTIFIED BY 'replace-with-strong-password';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
ON campus_match.*
TO 'campus_app'@'%';

FLUSH PRIVILEGES;
```

如果云厂商不允许自己执行 `CREATE USER`，就在控制台创建账号，并把上面的权限授给 `campus_match`。

## 3. 本地填写云数据库配置

复制模板：

```powershell
Copy-Item deploy/netlify-mysql.env.example .env.production-mysql
```

编辑 `.env.production-mysql`，填入真实值：

```text
MYSQL_HOST=your-rds-host.example.com
MYSQL_PORT=3306
MYSQL_DATABASE=campus_match
MYSQL_USER=campus_app
MYSQL_PASSWORD=your-cloud-password
MYSQL_SSL=true
MYSQL_SSL_REJECT_UNAUTHORIZED=true
```

`.env.production-mysql` 不会提交到 GitHub。

## 4. 体检云数据库

先只检查连接和建表：

```powershell
npm run check:mysql:production -- --env .env.production-mysql
```

再做一次写入测试：

```powershell
npm run check:mysql:production -- --env .env.production-mysql --write-test
```

成功后会看到基础表和中文看板表的数量。

## 5. 把当前线上数据导入云 MySQL

```powershell
npm run sync:mysql -- --env .env.production-mysql --use-existing-database
```

这会从当前线上数据源导出用户、匹配、聊天记录，再导入云 MySQL，并刷新中文看板表。

## 6. 设置 Netlify 生产环境变量

不要把密码写进 `netlify.toml`。用 Netlify CLI 设置生产环境变量：

```powershell
npx netlify env:set MYSQL_HOST "your-rds-host.example.com" --context production
npx netlify env:set MYSQL_PORT "3306" --context production
npx netlify env:set MYSQL_DATABASE "campus_match" --context production
npx netlify env:set MYSQL_USER "campus_app" --context production
npx netlify env:set MYSQL_PASSWORD "your-cloud-password" --secret --context production
npx netlify env:set MYSQL_SSL "true" --context production
npx netlify env:set MYSQL_SSL_REJECT_UNAUTHORIZED "true" --context production
```

如果服务商提供 CA 证书，也可以设置：

```powershell
npx netlify env:set MYSQL_SSL_CA "-----BEGIN CERTIFICATE-----..." --secret --context production
```

## 7. 部署并验证

```powershell
npx netlify deploy --prod
```

部署后检查：

- `https://campus-match-sansui.netlify.app/api/health`
- 注册 / 登录
- 修改资料
- 匹配和聊天
- HeidiSQL 连接云库查看 `看板_用户列表`

## 8. 回滚方式

如果云 MySQL 连接异常，可以临时移除生产环境的 MySQL 变量，后端会回到 Netlify Blobs：

```powershell
npx netlify env:unset MYSQL_HOST --context production
npx netlify env:unset MYSQL_PORT --context production
npx netlify env:unset MYSQL_DATABASE --context production
npx netlify env:unset MYSQL_USER --context production
npx netlify env:unset MYSQL_PASSWORD --context production
npx netlify env:unset MYSQL_SSL --context production
npx netlify env:unset MYSQL_SSL_REJECT_UNAUTHORIZED --context production
```

然后重新部署一次生产站。
