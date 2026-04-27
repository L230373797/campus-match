本目录是项目的本地 MySQL 起步配置。

1. 先复制一份环境变量模板：

```powershell
Copy-Item .env.example .env.local
```

2. 在 `.env.local` 里填好：

```text
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=campus_match
MYSQL_USER=root
MYSQL_PASSWORD=你的MySQL密码
```

3. 只初始化表结构：

```powershell
npm run sync:mysql -- --schema-only
```

4. 初始化并把当前线上数据同步到本地 MySQL：

```powershell
npm run sync:mysql
```

默认会优先从 Netlify Blobs 拉取数据，这样能保留现有用户的密码哈希，后续切 MySQL 时更平滑。
