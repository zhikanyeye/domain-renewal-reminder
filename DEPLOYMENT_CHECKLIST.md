# 部署检查清单

使用这个清单确保所有部署步骤都已完成。

---

## 📋 部署前准备

- [ ] Node.js v18+ 已安装
- [ ] npm 已安装
- [ ] Git 已安装
- [ ] Cloudflare 账号已注册
- [ ] Cloudflare 邮箱已验证
- [ ] Wrangler CLI 已安装 (`npm install -g wrangler`)
- [ ] Wrangler 已登录 (`wrangler login`)
- [ ] 项目依赖已安装 (`npm install`)
- [ ] 前端依赖已安装 (`cd frontend && npm install`)

---

## 🗄️ 数据库设置

- [ ] D1 生产数据库已创建
  ```bash
  wrangler d1 create domain_renewal_db
  ```
- [ ] D1 开发数据库已创建（可选）
  ```bash
  wrangler d1 create domain_renewal_db_dev
  ```
- [ ] `wrangler.toml` 中的 `database_id` 已更新
- [ ] 数据库表结构已初始化
  ```bash
  wrangler d1 execute domain_renewal_db --file=schema.sql
  ```
- [ ] 数据库表已验证
  ```bash
  wrangler d1 execute domain_renewal_db --command="SELECT name FROM sqlite_master WHERE type='table';"
  ```
  应该看到：users, domains, admin_logs

---

## 🔑 KV 存储设置

- [ ] KV 生产命名空间已创建
  ```bash
  wrangler kv:namespace create "KV"
  ```
- [ ] KV 开发命名空间已创建（可选）
  ```bash
  wrangler kv:namespace create "KV" --preview
  ```
- [ ] `wrangler.toml` 中的 KV `id` 已更新
- [ ] KV 命名空间已验证
  ```bash
  wrangler kv:namespace list
  ```

---

## 🔐 环境变量设置

- [ ] 管理员密码已生成（建议至少16字符）
- [ ] 管理员密码已设置
  ```bash
  wrangler secret put ADMIN_PASSWORD
  ```
- [ ] 加密密钥已生成（32字节十六进制）
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] 加密密钥已设置
  ```bash
  wrangler secret put ENCRYPTION_KEY
  ```
- [ ] Secrets 已验证
  ```bash
  wrangler secret list
  ```
  应该看到：ADMIN_PASSWORD, ENCRYPTION_KEY

---

## 🚀 后端部署

- [ ] TypeScript 类型检查通过
  ```bash
  npm run type-check
  ```
- [ ] 测试通过
  ```bash
  npm test
  ```
- [ ] 本地开发服务器测试通过（可选）
  ```bash
  npm run dev
  # 访问 http://localhost:8787/api/health
  ```
- [ ] 后端已部署到 Cloudflare Workers
  ```bash
  npm run deploy
  ```
- [ ] Worker URL 已记录
  ```
  https://domain-renewal-reminder.your-subdomain.workers.dev
  ```
- [ ] 后端健康检查通过
  ```bash
  curl https://your-worker-url/api/health
  ```

---

## 🎨 前端部署

- [ ] 前端生产环境变量已配置
  ```bash
  cd frontend
  echo "VITE_API_URL=https://your-worker-url/api" > .env.production
  ```
- [ ] 前端已构建
  ```bash
  npm run build
  ```
- [ ] 构建产物已验证（`frontend/dist` 目录存在）
- [ ] 前端已部署到 Cloudflare Pages
  ```bash
  wrangler pages deploy dist --project-name=domain-renewal-reminder-frontend
  ```
  或通过 Git 连接自动部署
- [ ] Pages URL 已记录
  ```
  https://domain-renewal-reminder-frontend.pages.dev
  ```
- [ ] 前端可以访问

---

## 📧 邮件服务配置

- [ ] 邮件服务提供商已选择（Resend/Mailgun/SendGrid）
- [ ] 邮件服务账号已注册
- [ ] API Key 已获取
- [ ] 发件人域名已验证（如果需要）
- [ ] `src/services/email.ts` 已修改为使用实际邮件服务
- [ ] 修改后的代码已重新部署
  ```bash
  npm run deploy
  ```
- [ ] 在管理员面板配置了 SMTP 设置

---

## ✅ 功能测试

### 后端 API 测试

- [ ] 健康检查 API 正常
  ```bash
  curl https://your-worker-url/api/health
  ```
- [ ] 注册 API 正常
  ```bash
  curl -X POST https://your-worker-url/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@gmail.com","password":"Test1234"}'
  ```
- [ ] 登录 API 正常
- [ ] 域名管理 API 正常

### 前端功能测试

- [ ] 前端页面可以访问
- [ ] 注册功能正常
- [ ] 登录功能正常
- [ ] Dashboard 页面正常显示
- [ ] 添加域名功能正常
- [ ] 编辑域名功能正常
- [ ] 删除域名功能正常
- [ ] 域名过滤功能正常
- [ ] 域名分组视图正常

### 管理员功能测试

- [ ] 管理员登录页面可以访问
- [ ] 管理员密码登录正常
- [ ] 用户列表显示正常
- [ ] 拉黑用户功能正常
- [ ] 删除用户功能正常
- [ ] SMTP 配置页面正常
- [ ] 操作日志显示正常

### 邮件功能测试

- [ ] 注册验证邮件可以发送（如果实现了）
- [ ] 提醒邮件可以发送
- [ ] 邮件内容格式正确
- [ ] 邮件链接可以点击

### Cron 任务测试

- [ ] Cron 触发器已配置
- [ ] 手动触发 Cron 任务成功
- [ ] Cron 任务日志正常

---

## 🔒 安全检查

- [ ] 管理员密码足够强（至少16字符）
- [ ] 加密密钥已安全保存
- [ ] Secrets 未提交到 Git
- [ ] CORS 配置正确
- [ ] 速率限制已启用
- [ ] HTTPS 已启用（Cloudflare 自动）
- [ ] 敏感信息未暴露在前端代码中

---

## 📊 监控设置

- [ ] Cloudflare Workers Analytics 已启用
- [ ] 日志查看方式已了解
  ```bash
  wrangler tail
  ```
- [ ] 错误告警已配置（可选）
- [ ] 性能监控已配置（可选）

---

## 📝 文档和备份

- [ ] 部署文档已阅读
- [ ] Worker URL 已记录
- [ ] Pages URL 已记录
- [ ] 管理员密码已安全保存
- [ ] 加密密钥已安全保存
- [ ] 数据库已备份
  ```bash
  wrangler d1 export domain_renewal_db --output=backup.sql
  ```
- [ ] 重要配置已备份

---

## 🎯 自定义域名（可选）

- [ ] Worker 自定义域名已配置
- [ ] Pages 自定义域名已配置
- [ ] DNS 记录已生效
- [ ] SSL 证书已自动配置
- [ ] 前端 API URL 已更新为自定义域名

---

## 🚦 上线准备

- [ ] 所有功能测试通过
- [ ] 性能测试通过
- [ ] 安全检查通过
- [ ] 文档已完善
- [ ] 团队成员已培训（如果有）
- [ ] 用户指南已准备（如果需要）
- [ ] 支持渠道已建立（如果需要）

---

## 📈 上线后

- [ ] 监控第一批用户注册
- [ ] 检查邮件发送情况
- [ ] 查看错误日志
- [ ] 收集用户反馈
- [ ] 优化性能（如果需要）
- [ ] 定期备份数据

---

## ✨ 完成！

恭喜！你的域名续期提醒服务已经成功部署。

**重要链接：**
- 前端：`https://your-pages-url`
- 后端：`https://your-worker-url`
- 管理员：`https://your-pages-url/admin`

**下一步：**
1. 添加你的第一个域名
2. 等待第一封提醒邮件
3. 根据使用情况优化和改进

---

## 📞 获取帮助

如果遇到问题：
- 查看 `DEPLOYMENT_GUIDE.md` 详细指南
- 查看 `BACKEND_STATUS.md` 后端状态
- 查看 Cloudflare 文档
- 提交 GitHub Issue

---

**部署日期：** _______________

**部署人员：** _______________

**备注：** _______________
