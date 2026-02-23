# 快速部署指南（5分钟）

这是一个精简版的部署指南，适合有经验的开发者快速部署。

---

## 前置条件

- Node.js v18+
- Cloudflare 账号
- Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

---

## 1. 后端部署（3分钟）

```bash
# 1. 创建 D1 数据库
wrangler d1 create domain_renewal_db

# 2. 复制输出的 database_id，更新 wrangler.toml
# [[d1_databases]]
# database_id = "粘贴这里"

# 3. 初始化数据库
wrangler d1 execute domain_renewal_db --file=schema.sql

# 4. 创建 KV 命名空间
wrangler kv:namespace create "KV"

# 5. 复制输出的 id，更新 wrangler.toml
# [[kv_namespaces]]
# id = "粘贴这里"

# 6. 设置环境变量
wrangler secret put ADMIN_PASSWORD
# 输入管理员密码

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 复制输出

wrangler secret put ENCRYPTION_KEY
# 粘贴上面的密钥

# 7. 部署
npm run deploy
```

**记录你的 Worker URL！**

---

## 2. 前端部署（2分钟）

```bash
# 1. 配置 API URL
cd frontend
echo "VITE_API_URL=https://你的worker.workers.dev/api" > .env.production

# 2. 构建
npm run build

# 3. 部署
wrangler pages deploy dist --project-name=domain-renewal-reminder-frontend
```

**记录你的 Pages URL！**

---

## 3. 配置邮件服务（可选）

### 使用 Resend（推荐）

1. 注册 [Resend](https://resend.com)
2. 获取 API Key
3. 修改 `src/services/email.ts` 的 `sendEmail` 方法：

```typescript
async sendEmail(to: string, subject: string, htmlBody: string): Promise<ApiResponse> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.smtpConfig.password}`,
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

    return { success: true, message: 'Email sent successfully' };
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

4. 重新部署：`npm run deploy`
5. 在管理员面板配置 SMTP（密码填 Resend API Key）

---

## 4. 测试

```bash
# 测试后端
curl https://你的worker.workers.dev/api/health

# 测试前端
# 访问你的 Pages URL，注册并登录
```

---

## 完成！

你的服务已经部署完成。

**访问地址：**
- 前端：`https://你的项目.pages.dev`
- 后端：`https://你的worker.workers.dev`
- 管理员：`https://你的项目.pages.dev/admin`

**下一步：**
1. 在管理员面板配置 SMTP
2. 添加你的第一个域名
3. 等待提醒邮件

---

## 常用命令

```bash
# 查看日志
wrangler tail

# 更新部署
npm run deploy

# 数据库查询
wrangler d1 execute domain_renewal_db --command="SELECT * FROM users;"

# 备份数据库
wrangler d1 export domain_renewal_db --output=backup.sql
```

---

## 遇到问题？

查看完整部署指南：`DEPLOYMENT_GUIDE.md`
