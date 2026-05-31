<!-- markdownlint-disable MD033 -->
# 爱自由域名管理 / Domain Renewal Reminder Service

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)

一个基于 Cloudflare 免费资源构建的域名续费管理与提醒服务，帮助你及时续费域名，避免域名过期。

[English](#english) | [中文](#中文)

</div>

---

## 📸 界面预览

| 用户面板 | AI 智能导入 | 后台邮箱配置 |
| --- | --- | --- |
| ![用户面板](docs/screenshots/user-dashboard.png) | ![导入域名](docs/screenshots/import-domains.png) | ![邮箱配置](docs/screenshots/admin-email-config.png) |

---

## 中文

### 📖 简介

爱自由域名管理是一个免费的 Web 应用，帮助用户统一管理域名续费时间、提醒计划和邮件通知。系统会自动计算到期日期，并通过定时邮件提醒机制降低域名过期风险。

**核心特性：**

- ✅ 用户注册、登录和邮箱验证
- ✅ 域名管理（添加、编辑、删除、批量导入）
- ✅ AI 智能导入（支持图片识别、文字解析、历史载入/重试/删除）
- ✅ 自动计算到期日期和提醒开始日期
- ✅ 定时邮件提醒（每天自动检查）
- ✅ 灵活的邮件配置（支持 HTTP API 和 SMTP）
- ✅ 域名过滤、搜索和分组查看
- ✅ 续费闭环：已续费、已处理、暂停提醒、已放弃
- ✅ 续费后自动顺延下一个周期并重置提醒进度
- ✅ 支持负责人、处理备注、处理时间记录
- ✅ 管理员面板（用户管理、邮件配置、邮件日志、手动触发提醒）
- ✅ 隐藏式管理员入口（三击标题或按 `K` 三次唤出）
- ✅ 响应式设计（支持手机、平板、电脑，含空状态插图和暗色模式适配）
- ✅ 基于 Cloudflare 免费套餐，个人或小团队可长期使用

### 🏗️ 技术栈

**后端：**

- Cloudflare Workers
- Hono
- TypeScript
- Cloudflare D1
- Cloudflare KV
- Cloudflare Cron Triggers

**前端：**

- React 19
- Vite
- Tailwind CSS
- TypeScript
- React Router

**安全：**

- PBKDF2 密码哈希（Web Crypto API）
- AES-256-GCM 数据加密
- 会话管理
- 速率限制

### 🚀 快速开始

**推荐部署顺序：**

1. 先部署后端 → [完整部署指南](DEPLOYMENT_GUIDE.md)
2. 再部署前端 → [Git 集成部署](GIT_DEPLOYMENT_GUIDE.md)
3. 配置邮件服务 → [邮件服务配置](EMAIL_SETUP.md)

### 📚 文档

- [完整部署指南](DEPLOYMENT_GUIDE.md) - 后端、数据库和升级说明
- [Git 集成部署](GIT_DEPLOYMENT_GUIDE.md) - 前端自动部署流程
- [邮件服务配置](EMAIL_SETUP.md) - HTTP API / SMTP 配置方法

### 🛠️ 本地开发

#### 前置要求

- Node.js v18+
- npm
- Wrangler CLI

#### 安装依赖

```bash
npm install

cd frontend
npm install
cd ..
```

#### 配置本地环境

```bash
# 创建本地 D1 数据库
wrangler d1 create domain_renewal_db_dev

# 初始化数据库
wrangler d1 execute domain_renewal_db_dev --file=schema.sql

# 创建本地 KV
wrangler kv namespace create KV --preview
```

#### 启动开发服务器

```bash
# 设置必须的 Worker secrets（示例）
wrangler secret put ADMIN_PASSWORD
wrangler secret put ENCRYPTION_KEY
wrangler secret put ZAI_API_KEY

# 启动后端
npm run dev

# 启动前端
cd frontend
npm run dev
```

访问地址：

- 前端：<http://localhost:5173>
- 后端：<http://localhost:8787>

#### 运行测试

```bash
npm run type-check
npm test
npm run test:coverage
```

### 📦 项目结构

```text
domain-renewal-reminder/
├── src/                      # 后端源代码
│   ├── index.ts             # 主入口
│   ├── middleware/          # 中间件
│   ├── routes/              # API 路由
│   ├── services/            # 业务逻辑
│   ├── types/               # TypeScript 类型
│   └── utils/               # 工具函数
├── frontend/                # 前端源代码
│   ├── src/
│   │   ├── api/             # API 客户端
│   │   ├── components/      # UI 组件
│   │   ├── contexts/        # React Context
│   │   ├── pages/           # 页面组件
│   │   └── main.tsx         # 前端入口
│   └── public/              # 静态资源
├── migrations/              # 数据库迁移文件
├── schema.sql               # 数据库 Schema
├── wrangler.toml            # Cloudflare 配置
├── package.json             # 后端依赖
└── frontend/package.json    # 前端依赖
```

### 📧 邮件配置

系统支持两种邮件发送方式，可在管理员面板中切换：

#### 方式一：HTTP API（推荐）

支持：

- Resend
- SendGrid
- Mailgun
- 自定义 HTTP API

**优点：**

- ✅ 配置简单
- ✅ 稳定性高
- ✅ 免费额度适合个人使用
- ✅ 维护成本低

#### 方式二：SMTP（高级）

支持端口：

- 465（SSL）
- 587（TLS）
- ❌ 25（Cloudflare Workers 不支持）

适合：

- 企业邮箱
- 自建邮件服务器
- 需要使用固定 SMTP 服务商的场景

详细步骤见 [邮件服务配置](EMAIL_SETUP.md)。

### 🤖 AI 智能导入

仪表盘中的"批量导入 / AI 识别"现已支持三种来源：

- CSV 模板导入
- 粘贴注册商列表、账单或提醒邮件文字
- 上传后台截图、账单截图等图片
- 最近识别历史、成功草稿载入、文字来源失败重试、单条删除和一键清空
- 常见注册商自动补全续费入口（Cloudflare、GoDaddy、Namecheap、Spaceship、Porkbun）

AI 识别流程采用"先识别、后确认、再入库"的方式：

- 后端通过 Cloudflare Worker 调用智谱国际版 `https://api.z.ai/api/paas/v4/chat/completions`
- 默认视觉模型为 `GLM-4.6V-Flash`
- 识别结果会先生成可编辑草稿，用户确认后才批量导入
- 识别历史只保存摘要、草稿和错误信息；图片原始内容不会长期入库，并支持用户自行删除或清空历史

需要配置以下 Worker secrets / vars：

```bash
wrangler secret put ZAI_API_KEY
```

可选变量：

```bash
# 默认值已内置，可按需覆盖
ZAI_BASE_URL=https://api.z.ai/api/paas/v4
ZAI_VISION_MODEL=GLM-4.6V-Flash
```

### 🔄 续费闭环

当前版本已经支持完整的基础状态流转：

- `active`：提醒中
- `handled`：已处理
- `paused`：暂停提醒
- `abandoned`：已放弃

工作流能力：

- 续费后自动顺延一个使用周期
- 自动重算下一轮 `expiry_date` 和 `reminder_start_date`
- 自动清零 `reminders_sent`
- 记录 `owner`、`status_note`、`processed_at`
- Reminder cron 只处理 `status = active` 的域名

### 🗃️ 数据库迁移

如果是新建数据库，直接执行：

```bash
wrangler d1 execute domain_renewal_db --remote --file=schema.sql
```

如果是旧库升级，请按顺序执行：

```bash
wrangler d1 execute domain_renewal_db --remote --file=migrations/0002_email_send_logs.sql
wrangler d1 execute domain_renewal_db --remote --file=migrations/0003_domain_status_workflow.sql
wrangler d1 execute domain_renewal_db --remote --file=migrations/0004_domain_workflow_fields.sql
wrangler d1 execute domain_renewal_db --remote --file=migrations/0005_ai_import_history.sql
```

升级后 `domains` 表应包含以下字段：

- `status`
- `status_note`
- `owner`
- `processed_at`
- `last_renewed_at`

### 🔐 安全特性

- **密码安全**：PBKDF2 哈希
- **数据加密**：AES-256-GCM
- **会话管理**：安全 token，自动过期
- **速率限制**：防止暴力破解
- **邮箱验证**：注册验证与重发验证
- **访问控制**：用户认证与管理员认证中间件
- **入口隐藏**：管理员入口默认不直接展示

### 📊 数据库设计

**users 表：**

- 用户信息
- 邮箱验证状态
- 黑名单状态

**domains 表：**

- 域名基础信息
- 到期日期和提醒设置
- 提醒发送记录
- 状态流转字段
- 负责人、备注、处理时间

**admin_logs 表：**

- 管理员操作日志

**email_send_logs 表：**

- 发信记录
- 触发来源
- 失败原因

### 🎯 API 端点

#### 认证

- `POST /api/auth/register`
- `POST /api/auth/verify`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/resend-verification`

#### 域名管理

- `POST /api/domains`
- `POST /api/domains/batch`
- `GET /api/domains`
- `GET /api/domains/grouped`
- `PUT /api/domains/:id`
- `POST /api/domains/:id/renew`
- `DELETE /api/domains/:id`
- `POST /api/domains/ai-parse`
- `GET /api/domains/ai-history`
- `POST /api/domains/ai-history/:id/retry`
- `POST /api/domains/ai-history/:id/mark-imported`
- `DELETE /api/domains/ai-history/:id`
- `DELETE /api/domains/ai-history/clear`

#### 管理员

- `GET /api/admin/users`
- `POST /api/admin/users/:id/blacklist`
- `DELETE /api/admin/users/:id`
- `POST /api/admin/smtp`
- `GET /api/admin/smtp`
- `GET /api/admin/logs`
- `GET /api/admin/email-logs`
- `POST /api/admin/reminders/run`

### 💰 成本估算

基于 Cloudflare 免费套餐：

- **Workers**：100,000 请求/天
- **D1**：5GB 存储
- **KV**：100,000 读取/天，1,000 写入/天
- **Pages**：500 次构建/月

**结论：个人使用或小团队场景基本可免费运行。**

### 🌐 免费域名推荐

既然是域名管理工具，这里推荐几个靠谱的免费域名注册平台：

#### Gname — 免费 .eu.cc 域名

- [官网注册](https://gname.vip/tld-eu-cc.html)
- 每人可免费注册 3 个 .eu.cc 后缀域名
- 支持自定义 NS 服务器，可托管到 Cloudflare

#### ZoneABC — 免费子域名

- [注册地址](https://zoneabc.net/register?invite=9487af8186fb4ffbac5d347d9a543098)（含邀请码）
- 提供免费子域名注册服务
- 接入 Cloudflare 企业级防护

#### DigitalPlat — 免费域名平台

- [注册地址](https://dash.domain.digitalplat.org/signup?ref=CXjbm3l0yE)（含邀请码）
- 提供多种免费域名后缀
- 支持修改 NS 服务器

#### DNSHE — 免费域名注册

- [注册地址](https://my.dnshe.com/index.php?m=domain_hub&view=tools&invite_code=VAVF68G4N7KB)（含邀请码）
- 国内团队运营，中文界面友好
- DNS 解析功能完善

#### StackRyze — 多后缀免费域名

- [官网注册](https://domain.stackryze.com/)
- 支持多种后缀：`indevs.in`、`sryze.cc`、`ryzedns.org`、`nx.kg`
- 一年免费期，到期可无限续期

#### VPS8 — 专业级 DNS 托管

- [官网注册](https://vps8.zz.cd)
- 自带 PowerDNS 管理系统
- 支持根域名 CNAME 记录（CNAME Flattening）

> 以上平台注册的域名大多支持修改 NS 服务器托管到 Cloudflare，享受 CDN 加速和 DDoS 防护。

### 📄 许可证

本项目采用 [MIT License](LICENSE)。

### 📞 支持

如果遇到问题：

1. 查看 [部署指南](DEPLOYMENT_GUIDE.md)
2. 查看 [邮件配置文档](EMAIL_SETUP.md)
3. 提交 GitHub Issue

---

## English

### 📖 Introduction

Domain Renewal Reminder Service is a free web application for managing domain renewals, reminder schedules, and email notifications. It helps users avoid accidental domain expiration with automated reminder workflows.

**Core Features:**

- ✅ User registration, login, and email verification
- ✅ Domain CRUD and batch import
- ✅ AI-assisted import with history load, retry, and delete
- ✅ Automatic expiry and reminder date calculation
- ✅ Scheduled daily reminder checks
- ✅ Flexible mail delivery via HTTP API or SMTP
- ✅ Domain filtering, search, and grouped views
- ✅ Renewal workflow loop: renewed, handled, paused, abandoned
- ✅ Automatic rollover to the next renewal cycle
- ✅ Owner, note, and processed-time tracking
- ✅ Admin panel for users, SMTP config, email logs, and manual reminder runs
- ✅ Hidden admin entry
- ✅ Responsive UI with illustrated empty states and dark-mode support
- ✅ Built on Cloudflare free-tier friendly services

### 🏗️ Tech Stack

**Backend:**

- Cloudflare Workers
- Hono
- TypeScript
- Cloudflare D1
- Cloudflare KV
- Cloudflare Cron Triggers

**Frontend:**

- React 19
- Vite
- Tailwind CSS
- TypeScript
- React Router

### 🚀 Quick Start

- Backend and database setup: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Frontend deployment: [GIT_DEPLOYMENT_GUIDE.md](GIT_DEPLOYMENT_GUIDE.md)
- Mail setup: [EMAIL_SETUP.md](EMAIL_SETUP.md)

### 🔄 Renewal Workflow

The current workflow supports:

- `active`
- `handled`
- `paused`
- `abandoned`

Behavior:

- `POST /api/domains/:id/renew` rolls the domain into the next cycle
- resets `reminders_sent`
- recalculates `expiry_date` and `reminder_start_date`
- records `owner`, `status_note`, `processed_at`, and `last_renewed_at`
- cron reminders only run for `active` domains

### 🗃️ Database Migration

For a fresh database:

```bash
wrangler d1 execute domain_renewal_db --remote --file=schema.sql
```

For upgrading an older database:

```bash
wrangler d1 execute domain_renewal_db --remote --file=migrations/0002_email_send_logs.sql
wrangler d1 execute domain_renewal_db --remote --file=migrations/0003_domain_status_workflow.sql
wrangler d1 execute domain_renewal_db --remote --file=migrations/0004_domain_workflow_fields.sql
wrangler d1 execute domain_renewal_db --remote --file=migrations/0005_ai_import_history.sql
```

### 🌐 Free Domain Recommendations

Here are some reliable free domain registration platforms:

#### Gname — Free .eu.cc Domains

- [Register](https://gname.vip/tld-eu-cc.html)
- 3 free .eu.cc domains per person
- Supports custom NS servers, can be hosted on Cloudflare

#### ZoneABC — Free Subdomains

- [Register](https://zoneabc.net/register?invite=9487af8186fb4ffbac5d347d9a543098) (with invite code)
- Free subdomain registration service
- Cloudflare enterprise-level protection

#### DigitalPlat — Free Domain Platform

- [Register](https://dash.domain.digitalplat.org/signup?ref=CXjbm3l0yE) (with referral code)
- Multiple free domain suffixes available
- Supports NS server modification

#### DNSHE — Free Domain Registration

- [Register](https://my.dnshe.com/index.php?m=domain_hub&view=tools&invite_code=VAVF68G4N7KB) (with invite code)
- Chinese-friendly interface
- Comprehensive DNS resolution features

#### StackRyze — Multi-suffix Free Domains

- [Register](https://domain.stackryze.com/)
- Supports: `indevs.in`, `sryze.cc`, `ryzedns.org`, `nx.kg`
- One year free, unlimited renewals

#### VPS8 — Professional DNS Hosting

- [Register](https://vps8.zz.cd)
- Built-in PowerDNS management system
- Supports root domain CNAME records (CNAME Flattening)

> Most domains from these platforms support NS server modification to Cloudflare for CDN acceleration and DDoS protection.

### 📄 License

This project is licensed under the [MIT License](LICENSE).

### 📞 Support

If you run into issues:

1. Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. Check [EMAIL_SETUP.md](EMAIL_SETUP.md)
3. Open a GitHub Issue

---

<div align="center">

Made with Cloudflare Workers

[⬆ Back to Top](#爱自由域名管理--domain-renewal-reminder-service)

</div>
