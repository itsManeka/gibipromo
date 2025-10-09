# 🎯 GibiPromo Platform

[![License: GIBIPROMO](https://img.shields.io/badge/License-GIBIPROMO-blueviolet.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)

> 🚀 Monitor Amazon prices at scale with serverless precision — powered by AWS, Clean Architecture, and TypeScript.

A professional, scalable solution for monitoring Amazon product prices using **Clean Architecture**, **AWS Free Tier**, and modern **TypeScript** practices.  
Built as a **monorepo** platform ready for multi-application expansion.

---

## 📖 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
- [Package Architecture](#-package-architecture)
- [Commands Reference](#-commands-reference)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Deployment & Infrastructure](#-deployment--infrastructure)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🏗️ Architecture Overview

```

gibipromo-platform/
├── packages/
│   ├── shared/            # Shared entities & utilities
│   ├── telegram-bot/      # Telegram bot application
│   ├── web-api/           # REST API for web interfaces
│   ├── website/           # React management dashboard
│   └── chrome-extension/  # Amazon page integration
├── scripts/               # Infra & automation scripts
├── docker/                # Local development containers
└── infrastructure/        # AWS deployment configurations

````

---

## ✨ Key Features

### 🤖 Intelligent Bot Interface
- Multi-command Telegram bot with intuitive UX
- Real-time price tracking and batch notifications
- Optimized PA-API calls via round-robin verification

### 🏛️ Enterprise-Grade Architecture
- **Clean Architecture** + **Domain-Driven Design**
- Fully **SOLID-compliant**
- Test coverage requirement: **80%+**

### ☁️ AWS-Optimized Infrastructure
- **Lambda** for serverless compute
- **DynamoDB** for scalable data
- **S3** for asset storage
- Fully Free-Tier compatible

### 📊 Monitoring & Analytics
- Batched PA-API calls for rate efficiency
- Configurable thresholds
- Price history tracking

---

## 🚀 Quick Start

```bash
git clone https://github.com/itsManeka/gibipromo.git
cd gibipromo && npm install
cp .env.example .env
docker compose up -d
npm run dev:bot
````

> 🧠 Up and running in 5 commands!

**Prerequisites**

* Node.js ≥ 18
* npm ≥ 8
* Docker (for local DynamoDB)
* AWS CLI (for deployment)

---

## 📦 Package Architecture

| Package                         | Description                   | Tech                 |
| ------------------------------- | ----------------------------- | -------------------- |
| **@gibipromo/shared**           | Shared utilities and entities | TypeScript           |
| **@gibipromo/telegram-bot**     | Telegram bot core             | Node.js + AWS Lambda |
| **@gibipromo/web-api**          | REST API                      | Express              |
| **@gibipromo/website**          | Management portal             | React                |
| **@gibipromo/chrome-extension** | Amazon page integration       | Manifest V3          |

---

## 🛠️ Commands Reference

### Development & Testing

```bash
npm run dev:bot          # Start Telegram bot
npm run dev:api          # Start web API
npm run dev:web          # Start website
npm run test             # Run all tests
npm run test:coverage    # Generate coverage reports
npm run lint             # Lint codebase
npm run type-check       # Validate TypeScript types
```

### Build & Deploy

```bash
npm run build            # Build all packages
npm run deploy           # Deploy to AWS
```

### Workspaces

```bash
npm run dev --workspace=@gibipromo/telegram-bot
npm run build --workspace=@gibipromo/web-api
```

---

## 🤖 Bot Commands

| Command    | Description               |
| ---------- | ------------------------- |
| `/start`   | Initialize user account   |
| `/enable`  | Activate price monitoring |
| `/disable` | Pause notifications       |
| `/addlink` | Add products to monitor   |
| `/list`    | View monitored products   |
| `/delete`  | Remove user account       |
| `/help`    | Show command reference    |

---

## 🧩 Clean Architecture

```
src/
├── domain/          # Entities & core business logic
├── application/     # Use cases & interfaces
└── infrastructure/  # External integrations (AWS, Telegram, etc.)
```

---

## 🧠 Performance Optimizations

1. **Batch Processing** – Consolidates up to 10 products per API call
2. **Round-Robin Verification** – Ensures balanced catalog scanning
3. **Smart Caching** – Minimizes DynamoDB reads and AWS costs

---

## 📊 Testing & Quality Assurance

* **Coverage Goal:** 80%+
* **Unit Tests:** Business logic
* **Integration:** External adapters
* **E2E:** Core user flows

**Quality Commands**

```bash
npm run lint
npm run test:coverage
npm run type-check
```

---

## 🚀 Deployment & Infrastructure

### AWS Stack

* **Lambda** – Serverless bot runtime
* **DynamoDB** – Scalable NoSQL
* **S3** – Asset storage
* **CloudWatch** – Monitoring

### Environments

```bash
# Development
NODE_ENV=development
USE_MOCK_PAAPI=true

# Production
NODE_ENV=production
USE_MOCK_PAAPI=false
```

---

## 👨‍💻 Author

**Emanuel Ozorio Dias (@itsManeka)**
💻 [GitHub](https://github.com/itsManeka)
📧 [emanuel.ozoriodias@gmail.com](mailto:emanuel.ozoriodias@gmail.com)

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Run tests (`npm test`)
5. Push & open a PR

**Guidelines**

* Maintain 80%+ coverage
* Follow Clean Architecture
* Use Conventional Commits
* Ensure tests run with `--maxWorkers=1`

---

## 📄 License

Distributed under the **GIBIPROMO License**

* ✅ Personal & educational use allowed
* ⚠️ Commercial use requires permission
* 💰 Licensed usage: 15% revenue share

See [LICENSE](./LICENSE) for details.

---

<div align="center">
Built with ❤️ to redefine how Amazon price tracking scales.
</div>