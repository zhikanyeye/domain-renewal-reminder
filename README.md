# 域名续期提醒服务 / Domain Renewal Reminder Service

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)

一个基于 Cloudflare 免费资源构建的域名续期提醒服务，帮助你及时续期域名，避免域名过期。

[English](#english) | [中文](#中文)

</div>

---

## 中文

### 📖 简介

域名续期提醒服务是一个完全免费的 Web 应用，帮助用户管理免费域名的续期时间。通过自动化的邮件提醒机制，确保你不会错过任何域名的续期时间。

**核心特性：**
- ✅ 用户注册和邮箱验证
- ✅ 域名管理（添加、编辑、删除）
- ✅ 自动计算到期日期和提醒日期
- ✅ 定时邮件提醒（每天自动检查）
- ✅ 域名过滤和分组
- ✅ 管理员面板（用户管理、SMTP 配置）
- ✅ 响应式设计（支持手机、平板、电脑）
- ✅ 完全免费（基于 Cloudflare 免费套餐）

### 🏗️ 技术栈

**后端：**
- Cloudflare Workers（Serverless 计算）
- Hono（轻量级 Web 框架）
- TypeScript
- Cloudflare D1（SQLite 数据库）
- Cloudflare KV（键值存储）
- Cloudflare Cron Triggers（定时任务）

**前端：**
- React 19
- Vite
- Tailwind CSS
- TypeScript
- React Router

**安全：**
- bcrypt 密码哈希
- AES-256-GCM 数据加密
- 会话管理
- 速率限制

### 🚀 快速开始

#### 方法 1: 5分钟快速部署

查看 [快速部署指南](QUICK_DEPLOY.md)

#### 方法 2: 完整部署

查看 [完整部署指南](DEPLOYMENT_GUIDE.md)

#### 方法 3: 使用检查清单

查看 [部署检查清单](DEPLOYMENT_CHECKLIST.md)

### 📚 文档

- [完整部署指南](DEPLOYMENT_GUIDE.md) - 详细的部署步骤和配置说明
- [快速部署指南](QUICK_DEPLOY.md) - 5分钟快速部署
- [部署检查清单](DEPLOYMENT_CHECKLIST.md) - 确保所有步骤都已完成
- [后端状态报告](BACKEND_STATUS.md) - 后端代码完整性检查
- [快速开始](QUICKSTART.md) - 项目概览和使用说明
- [实现状态](IMPLEMENTATION_STATUS.md) - 功能实现进度

### 🛠️ 本地开发

#### 前置要求

- Node.js v18+
- npm
- Wrangler CLI

#### 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

#### 配置本地环境

```bash
# 复制环境变量示例
cp .env.example .env

# 创建本地 D1 数据库
wrangler d1 create domain_renewal_db_dev

# 初始化数据库
wrangler d1 execute domain_renewal_db_dev --file=schema.sql

# 创建本地 KV
wrangler kv:namespace create "KV" --preview
```

#### 启动开发服务器

```bash
# 启动后端（终端 1）
npm run dev

# 启动前端（终端 2）
cd frontend
npm run dev
```

访问：
- 前端：http://localhost:5173
- 后端：http://localhost:8787

#### 运行测试

```bash
# 运行所有测试
npm test

# 运行类型检查
npm run type-check

# 查看测试覆盖率
npm run test:coverage
```

### 📦 项目结构

```
domain-renewal-reminder/
├── src/                      # 后端源代码
│   ├── index.ts             # 主入口
│   ├── middleware/          # 中间件
│   ├── routes/              # API 路由
│   ├── services/            # 业务逻辑
│   ├── types/               # TypeScript 类型
│   └── utils/               # 工具函数
├── frontend/                 # 前端源代码
│   ├── src/
│   │   ├── api/            # API 客户端
│   │   ├── contexts/       # React Context
│   │   ├── pages/          # 页面组件
│   │   └── main.tsx        # 前端入口
│   └── public/             # 静态资源
├── schema.sql               # 数据库 Schema
├── wrangler.toml           # Cloudflare 配置
├── package.json            # 后端依赖
└── frontend/package.json   # 前端依赖
```

### 🔐 安全特性

- **密码安全**：bcrypt 哈希（10 轮）
- **数据加密**：AES-256-GCM 加密敏感数据
- **会话管理**：安全的随机 token，7天自动过期
- **速率限制**：防止暴力破解（10请求/分钟）
- **邮箱验证**：白名单机制，支持 15+ 主流邮箱
- **访问控制**：用户认证和管理员认证中间件

### 📊 数据库设计

**users 表：**
- 用户信息
- 邮箱验证状态
- 黑名单状态

**domains 表：**
- 域名信息
- 到期日期（自动计算）
- 提醒设置
- 提醒发送记录

**admin_logs 表：**
- 管理员操作日志
- 审计追踪

### 🎯 API 端点

#### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/verify` - 邮箱验证
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户

#### 域名管理
- `POST /api/domains` - 添加域名
- `GET /api/domains` - 获取域名列表
- `GET /api/domains/grouped` - 获取分组域名
- `PUT /api/domains/:id` - 更新域名
- `DELETE /api/domains/:id` - 删除域名

#### 管理员
- `GET /api/admin/users` - 用户列表
- `POST /api/admin/users/:id/blacklist` - 拉黑用户
- `DELETE /api/admin/users/:id` - 删除用户
- `POST /api/admin/smtp` - 更新 SMTP 配置
- `GET /api/admin/smtp` - 获取 SMTP 配置
- `GET /api/admin/logs` - 获取操作日志

### 💰 成本估算

使用 Cloudflare 免费套餐：
- **Workers**: 100,000 请求/天 ✅ 免费
- **D1**: 5GB 存储，500万行读取/天 ✅ 免费
- **KV**: 100,000 读取/天，1,000 写入/天 ✅ 免费
- **Pages**: 500 次构建/月 ✅ 免费

**结论：对于个人使用或小型团队，完全免费！**

### 📄 许可证

MIT License

### 📞 支持

如果遇到问题：
1. 查看 [部署指南](DEPLOYMENT_GUIDE.md)
2. 查看 [常见问题](DEPLOYMENT_GUIDE.md#常见问题)
3. 提交 GitHub Issue

---

## English

### 📖 Introduction

Domain Renewal Reminder Service is a completely free web application that helps users manage domain renewal times. Through automated email reminder mechanisms, ensure you never miss any domain renewal deadline.

**Core Features:**
- ✅ User registration and email verification
- ✅ Domain management (add, edit, delete)
- ✅ Automatic calculation of expiry and reminder dates
- ✅ Scheduled email reminders (daily automatic checks)
- ✅ Domain filtering and grouping
- ✅ Admin panel (user management, SMTP configuration)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Completely free (based on Cloudflare free tier)

### 🏗️ Tech Stack

**Backend:**
- Cloudflare Workers (Serverless computing)
- Hono (Lightweight web framework)
- TypeScript
- Cloudflare D1 (SQLite database)
- Cloudflare KV (Key-value storage)
- Cloudflare Cron Triggers (Scheduled tasks)

**Frontend:**
- React 19
- Vite
- Tailwind CSS
- TypeScript
- React Router

**Security:**
- bcrypt password hashing
- AES-256-GCM data encryption
- Session management
- Rate limiting

### 🚀 Quick Start

#### Method 1: 5-Minute Quick Deploy

See [Quick Deploy Guide](QUICK_DEPLOY.md)

#### Method 2: Complete Deployment

See [Complete Deployment Guide](DEPLOYMENT_GUIDE.md)

#### Method 3: Use Checklist

See [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)

### 📚 Documentation

- [Complete Deployment Guide](DEPLOYMENT_GUIDE.md) - Detailed deployment steps and configuration
- [Quick Deploy Guide](QUICK_DEPLOY.md) - 5-minute quick deployment
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Ensure all steps are completed
- [Backend Status Report](BACKEND_STATUS.md) - Backend code integrity check
- [Quick Start](QUICKSTART.md) - Project overview and usage
- [Implementation Status](IMPLEMENTATION_STATUS.md) - Feature implementation progress

### 🛠️ Local Development

See the Chinese section above for detailed local development instructions.

### 📄 License

MIT License

### 📞 Support

If you encounter issues:
1. Check [Deployment Guide](DEPLOYMENT_GUIDE.md)
2. Check [FAQ](DEPLOYMENT_GUIDE.md#常见问题)
3. Submit GitHub Issue

---

<div align="center">

Made with ❤️ using Cloudflare Workers

[⬆ Back to Top](#域名续期提醒服务--domain-renewal-reminder-service)

</div>
