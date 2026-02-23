# 域名续期提醒服务 - 完整部署指南

本指南将帮助你从零开始部署域名续期提醒服务到 Cloudflare。

---

## 📋 目录

1. [前置要求](#前置要求)
2. [Cloudflare 账号设置](#cloudflare-账号设置)
3. [后端部署（Cloudflare Workers）](#后端部署cloudflare-workers)
4. [前端部署（Cloudflare Pages）](#前端部署cloudflare-pages)
5. [邮件服务配置](#邮件服务配置)
6. [测试部署](#测试部署)
7. [常见问题](#常见问题)

---

## 前置要求

### 1. 安装必要工具

```bash
# Node.js (推荐 v18 或更高版本)
node --version  # 应该显示 v18.x.x 或更高

# npm (通常随 Node.js 一起安装)
npm --version

# Git
git --version
```

### 2. 注册 Cloudflare 账号

1. 访问 [Cloudflare](https://dash.cloudflare.com/sign-up)
2. 注册免费账号
3. 验证邮箱

### 3. 克隆项目（如果还没有）

```bash
git clone <your-repo-url>
cd domain-renewal-reminder
```

### 4. 安装项目依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

---

## Cloudflare 账号设置

### 1. 安装 Wrangler CLI

Wrangler 是 Cloudflare Workers 的命令行工具。

```bash
npm install -g wrangler

# 验证安装
wrangler --version
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

这会打开浏览器，要求你授权 Wrangler 访问你的 Cloudflare 账号。

### 3. 验证登录

```bash
wrangler whoami
```

应该显示你的 Cloudflare 账号信息。

---

## 后端部署（Cloudflare Workers）

### 步骤 1: 创建 D1 数据库

D1 是 Cloudflare 的 SQLite 数据库服务。

```bash
# 创建生产数据库
wrangler d1 create domain_renewal_db

# 创建开发数据库（可选，用于本地测试）
wrangler d1 create domain_renewal_db_dev
```

**输出示例：**
```
✅ Successfully created DB 'domain_renewal_db'

[[d1_databases]]
binding = "DB"
database_name = "domain_renewal_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**重要：** 复制输出中的 `database_id`，你需要更新 `wrangler.toml` 文件。

### 步骤 2: 更新 wrangler.toml

打开 `wrangler.toml` 文件，更新数据库 ID：

```toml
# 生产环境
[[d1_databases]]
binding = "DB"
database_name = "domain_renewal_db"
database_id = "粘贴你的生产数据库ID"  # 替换这里

# 开发环境（如果创建了）
[env.dev]
name = "domain-renewal-reminder-dev"

[[env.dev.d1_databases]]
binding = "DB"
database_name = "domain_renewal_db_dev"
database_id = "粘贴你的开发数据库ID"  # 替换这里
```

### 步骤 3: 初始化数据库表结构

运行 SQL schema 文件来创建表：

```bash
# 生产数据库
wrangler d1 execute domain_renewal_db --file=schema.sql

# 开发数据库（如果创建了）
wrangler d1 execute domain_renewal_db_dev --file=schema.sql
```

**验证表创建：**
```bash
# 查看表列表
wrangler d1 execute domain_renewal_db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

应该看到：`users`, `domains`, `admin_logs`

### 步骤 4: 创建 KV 命名空间

KV 用于存储会话、SMTP 配置等。

```bash
# 创建生产 KV
wrangler kv:namespace create "KV"

# 创建开发 KV（可选）
wrangler kv:namespace create "KV" --preview
```

**输出示例：**
```
🌀 Creating namespace with title "domain-renewal-reminder-KV"
✨ Success!
Add the following to your wrangler.toml:
[[kv_namespaces]]
binding = "KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 步骤 5: 更新 wrangler.toml（KV）

将 KV ID 添加到 `wrangler.toml`：

```toml
# 生产环境
[[kv_namespaces]]
binding = "KV"
id = "粘贴你的生产KV ID"  # 替换这里

# 开发环境（如果创建了）
[[env.dev.kv_namespaces]]
binding = "KV"
id = "粘贴你的开发KV ID"  # 替换这里
```

### 步骤 6: 设置环境变量（Secrets）

设置管理员密码和加密密钥：

```bash
# 设置管理员密码
wrangler secret put ADMIN_PASSWORD
# 输入你的管理员密码（建议使用强密码）

# 生成并设置加密密钥
# 方法1: 使用 Node.js 生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 复制输出的密钥

# 设置加密密钥
wrangler secret put ENCRYPTION_KEY
# 粘贴刚才生成的密钥
```

**重要提示：**
- 管理员密码：用于访问管理员面板，建议至少 16 字符
- 加密密钥：必须是 64 个十六进制字符（32 字节）

**验证 Secrets：**
```bash
wrangler secret list
```

应该看到：`ADMIN_PASSWORD`, `ENCRYPTION_KEY`

### 步骤 7: 本地测试（可选但推荐）

在部署前，先在本地测试：

```bash
# 启动本地开发服务器
npm run dev
```

访问 `http://localhost:8787` 测试 API：

```bash
# 测试健康检查
curl http://localhost:8787/api/health

# 应该返回：
# {"success":true,"status":"healthy","timestamp":"..."}
```

### 步骤 8: 部署到 Cloudflare Workers

```bash
# 部署到生产环境
npm run deploy

# 或使用 wrangler 直接部署
wrangler deploy
```

**输出示例：**
```
Total Upload: xx.xx KiB / gzip: xx.xx KiB
Uploaded domain-renewal-reminder (x.xx sec)
Published domain-renewal-reminder (x.xx sec)
  https://domain-renewal-reminder.your-subdomain.workers.dev
```

**记录你的 Worker URL！** 你需要在前端配置中使用它。

### 步骤 9: 验证后端部署

```bash
# 测试健康检查
curl https://domain-renewal-reminder.your-subdomain.workers.dev/api/health

# 测试注册（应该返回邮箱域名验证错误或成功）
curl -X POST https://domain-renewal-reminder.your-subdomain.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"Test1234"}'
```

---

## 前端部署（Cloudflare Pages）

### 步骤 1: 配置前端环境变量

创建 `frontend/.env.production` 文件：

```bash
cd frontend
cat > .env.production << EOF
VITE_API_URL=https://domain-renewal-reminder.your-subdomain.workers.dev/api
EOF
```

**重要：** 将 URL 替换为你的实际 Worker URL（从上一步获得）。

### 步骤 2: 构建前端

```bash
# 在 frontend 目录下
npm run build
```

这会在 `frontend/dist` 目录生成生产版本。

### 步骤 3: 部署到 Cloudflare Pages

#### 方法 A: 使用 Wrangler（推荐）

```bash
# 在项目根目录
wrangler pages deploy frontend/dist --project-name=domain-renewal-reminder-frontend
```

#### 方法 B: 使用 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Pages** 部分
3. 点击 **Create a project**
4. 选择 **Upload assets**
5. 上传 `frontend/dist` 文件夹
6. 项目名称：`domain-renewal-reminder-frontend`
7. 点击 **Deploy**

#### 方法 C: 连接 Git 仓库（最佳实践）

1. 将代码推送到 GitHub/GitLab
2. 在 Cloudflare Pages 中选择 **Connect to Git**
3. 选择你的仓库
4. 配置构建设置：
   - **Build command:** `cd frontend && npm install && npm run build`
   - **Build output directory:** `frontend/dist`
   - **Root directory:** `/`
5. 添加环境变量：
   - `VITE_API_URL`: 你的 Worker URL
6. 点击 **Save and Deploy**

### 步骤 4: 获取前端 URL

部署完成后，你会得到一个 URL，类似：
```
https://domain-renewal-reminder-frontend.pages.dev
```

### 步骤 5: 配置 CORS（如果需要）

如果前端和后端在不同域名，需要确保 CORS 已启用。

检查 `src/index.ts`：

```typescript
import { cors } from 'hono/cors';

// 应该已经有这行
app.use('*', cors());
```

如果需要更严格的 CORS 配置：

```typescript
app.use('*', cors({
  origin: ['https://domain-renewal-reminder-frontend.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
```

重新部署后端：
```bash
npm run deploy
```

---

## 邮件服务配置

后端代码已经实现了邮件发送接口，但需要集成实际的邮件服务。

### 选项 1: Resend（推荐，简单易用）

1. 注册 [Resend](https://resend.com)
2. 获取 API Key
3. 修改 `src/services/email.ts`：

```typescript
async sendEmail(to: string, subject: string, htmlBody: string): Promise<ApiResponse> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.smtpConfig.password}`, // 使用 API Key
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${this.smtpConfig.fromName} <${this.smtpConfig.fromEmail}>`,
        to: [to],
        subject: subject,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`);
    }

    return {
      success: true,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.error('Email sending error:', error);
    await this.logEmailError(to, subject, error);
    return {
      success: false,
      error: {
        code: 'EMAIL_SEND_FAILED',
        message: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
```

4. 在管理员面板配置 SMTP：
   - Host: `api.resend.com`
   - Port: `443`
   - Username: `resend`
   - Password: `你的 Resend API Key`
   - From Email: `noreply@yourdomain.com`（需要在 Resend 验证域名）

### 选项 2: Mailgun

1. 注册 [Mailgun](https://www.mailgun.com)
2. 获取 API Key 和域名
3. 修改 `src/services/email.ts`：

```typescript
async sendEmail(to: string, subject: string, htmlBody: string): Promise<ApiResponse> {
  try {
    const auth = btoa(`api:${this.smtpConfig.password}`);
    const domain = 'mg.yourdomain.com'; // 你的 Mailgun 域名
    
    const formData = new FormData();
    formData.append('from', `${this.smtpConfig.fromName} <${this.smtpConfig.fromEmail}>`);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', htmlBody);

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Mailgun API error: ${response.statusText}`);
    }

    return {
      success: true,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.error('Email sending error:', error);
    await this.logEmailError(to, subject, error);
    return {
      success: false,
      error: {
        code: 'EMAIL_SEND_FAILED',
        message: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
```

### 选项 3: SendGrid

1. 注册 [SendGrid](https://sendgrid.com)
2. 获取 API Key
3. 修改 `src/services/email.ts`：

```typescript
async sendEmail(to: string, subject: string, htmlBody: string): Promise<ApiResponse> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.smtpConfig.password}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
        }],
        from: {
          email: this.smtpConfig.fromEmail,
          name: this.smtpConfig.fromName,
        },
        subject: subject,
        content: [{
          type: 'text/html',
          value: htmlBody,
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.statusText}`);
    }

    return {
      success: true,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.error('Email sending error:', error);
    await this.logEmailError(to, subject, error);
    return {
      success: false,
      error: {
        code: 'EMAIL_SEND_FAILED',
        message: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
```

### 配置邮件服务

修改代码后，重新部署：

```bash
npm run deploy
```

然后在管理员面板配置 SMTP 设置。

---

## 测试部署

### 1. 测试后端 API

```bash
# 设置变量
API_URL="https://domain-renewal-reminder.your-subdomain.workers.dev/api"

# 测试健康检查
curl $API_URL/health

# 测试注册
curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"Test1234"}'

# 测试登录（使用已注册的账号）
curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"Test1234"}'
```

### 2. 测试前端

1. 访问你的前端 URL
2. 尝试注册新账号
3. 检查邮箱验证邮件（如果配置了邮件服务）
4. 登录系统
5. 添加测试域名
6. 测试过滤和分组功能

### 3. 测试管理员面板

1. 访问 `https://your-frontend-url/admin`
2. 使用你设置的管理员密码登录
3. 查看用户列表
4. 配置 SMTP 设置
5. 查看操作日志

### 4. 测试 Cron 任务

Cron 任务会在每天 UTC 00:00 自动运行。你也可以手动触发：

```bash
# 在 Cloudflare Dashboard 中
# Workers & Pages > 你的 Worker > Triggers > Cron Triggers
# 点击 "Send test event"
```

或者使用 API：

```bash
curl -X POST https://domain-renewal-reminder.your-subdomain.workers.dev/__scheduled \
  -H "Content-Type: application/json"
```

---

## 自定义域名（可选）

### 为 Worker 配置自定义域名

1. 在 Cloudflare Dashboard 中，进入你的 Worker
2. 点击 **Triggers** 标签
3. 在 **Custom Domains** 部分，点击 **Add Custom Domain**
4. 输入域名（如 `api.yourdomain.com`）
5. Cloudflare 会自动配置 DNS

### 为 Pages 配置自定义域名

1. 在 Cloudflare Dashboard 中，进入你的 Pages 项目
2. 点击 **Custom domains** 标签
3. 点击 **Set up a custom domain**
4. 输入域名（如 `app.yourdomain.com`）
5. Cloudflare 会自动配置 DNS

### 更新前端配置

如果使用了自定义域名，更新 `frontend/.env.production`：

```bash
VITE_API_URL=https://api.yourdomain.com/api
```

重新构建和部署前端。

---

## 监控和维护

### 1. 查看 Worker 日志

```bash
# 实时查看日志
wrangler tail

# 或在 Cloudflare Dashboard 中查看
# Workers & Pages > 你的 Worker > Logs
```

### 2. 查看 Analytics

在 Cloudflare Dashboard 中：
- Workers & Pages > 你的 Worker > Analytics
- 查看请求数、错误率、执行时间等

### 3. 数据库管理

```bash
# 查询数据库
wrangler d1 execute domain_renewal_db --command="SELECT COUNT(*) FROM users;"

# 导出数据
wrangler d1 export domain_renewal_db --output=backup.sql

# 导入数据
wrangler d1 execute domain_renewal_db --file=backup.sql
```

### 4. 更新代码

```bash
# 拉取最新代码
git pull

# 安装依赖
npm install

# 运行测试
npm test

# 部署后端
npm run deploy

# 构建和部署前端
cd frontend
npm run build
wrangler pages deploy dist --project-name=domain-renewal-reminder-frontend
```

---

## 常见问题

### Q1: 部署后 API 返回 500 错误

**可能原因：**
- 数据库未初始化
- KV 命名空间未创建
- 环境变量未设置

**解决方法：**
```bash
# 检查数据库
wrangler d1 execute domain_renewal_db --command="SELECT name FROM sqlite_master WHERE type='table';"

# 检查 KV
wrangler kv:namespace list

# 检查 Secrets
wrangler secret list
```

### Q2: 前端无法连接后端

**可能原因：**
- CORS 配置问题
- API URL 配置错误

**解决方法：**
1. 检查 `frontend/.env.production` 中的 `VITE_API_URL`
2. 确保后端启用了 CORS
3. 检查浏览器控制台的错误信息

### Q3: 邮件发送失败

**可能原因：**
- SMTP 配置错误
- 邮件服务 API Key 无效
- 发件人邮箱未验证

**解决方法：**
1. 在管理员面板检查 SMTP 配置
2. 验证邮件服务的 API Key
3. 在邮件服务提供商处验证发件人域名

### Q4: Cron 任务不执行

**可能原因：**
- Cron 触发器未配置
- Worker 处于休眠状态

**解决方法：**
1. 检查 `wrangler.toml` 中的 cron 配置
2. 在 Cloudflare Dashboard 中手动触发测试
3. 查看 Worker 日志

### Q5: 数据库查询慢

**可能原因：**
- 缺少索引
- 查询未优化

**解决方法：**
1. 确保 `schema.sql` 中的所有索引都已创建
2. 使用 `EXPLAIN QUERY PLAN` 分析查询
3. 考虑添加更多索引

### Q6: 如何备份数据？

```bash
# 导出数据库
wrangler d1 export domain_renewal_db --output=backup-$(date +%Y%m%d).sql

# 导出 KV 数据（需要自己实现脚本）
# KV 没有直接的导出命令，建议定期备份重要数据
```

### Q7: 如何回滚部署？

```bash
# 查看部署历史
wrangler deployments list

# 回滚到特定版本
wrangler rollback [deployment-id]
```

### Q8: 成本估算

Cloudflare 免费套餐限制：
- **Workers**: 100,000 请求/天
- **D1**: 5GB 存储，500万行读取/天
- **KV**: 100,000 读取/天，1,000 写入/天
- **Pages**: 500 次构建/月

对于小型应用，免费套餐完全够用。

---

## 安全建议

1. **定期更新依赖**
   ```bash
   npm audit
   npm update
   ```

2. **使用强密码**
   - 管理员密码至少 16 字符
   - 包含大小写字母、数字和特殊字符

3. **启用 Cloudflare 安全功能**
   - WAF（Web Application Firewall）
   - DDoS 保护
   - Bot 管理

4. **定期备份数据**
   - 每周备份数据库
   - 保存重要配置

5. **监控异常活动**
   - 定期查看日志
   - 设置告警

---

## 下一步

部署完成后，你可以：

1. **添加更多功能**
   - 邮件模板自定义
   - 多语言支持
   - 数据导出功能

2. **优化性能**
   - 添加缓存
   - 优化数据库查询
   - 使用 CDN

3. **增强安全性**
   - 添加 2FA
   - IP 白名单
   - 审计日志

4. **改进用户体验**
   - 添加通知功能
   - 移动应用
   - 浏览器扩展

---

## 获取帮助

如果遇到问题：

1. 查看 [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
2. 查看 [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
3. 查看项目的 GitHub Issues
4. 加入 Cloudflare Discord 社区

---

## 总结

恭喜！你已经成功部署了域名续期提醒服务。

**部署清单：**
- ✅ 创建 D1 数据库
- ✅ 创建 KV 命名空间
- ✅ 设置环境变量
- ✅ 部署后端 Worker
- ✅ 部署前端 Pages
- ✅ 配置邮件服务
- ✅ 测试所有功能

**下一步：**
1. 添加你的第一个域名
2. 配置 SMTP 设置
3. 等待第一封提醒邮件

祝你使用愉快！🎉
