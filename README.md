# 🎯 GibiPromo Platform

[![GitHub](https://img.shields.io/github/license/itsManeka/gibipromo)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)

> **Advanced Amazon Price Monitoring System with Telegram Bot Interface**

A professional, scalable solution for monitoring Amazon product prices using **Clean Architecture**, **AWS Free Tier**, and modern **TypeScript** development practices. Built as a monorepo platform ready for multi-application expansion.

## 🏗️ Architecture Overview

```
gibipromo-platform/
├── packages/
│   ├── shared/          # Shared TypeScript entities & utilities
│   ├── telegram-bot/    # Core Telegram bot application
│   ├── web-api/         # REST API for web interfaces
│   ├── website/         # React-based management portal
│   └── chrome-extension/# Amazon page integration
├── scripts/             # Infrastructure setup scripts
├── docker/              # Local development containers
└── infrastructure/      # AWS deployment configurations
```

## ✨ Key Features

### 🤖 **Intelligent Bot Interface**
- Multi-command Telegram bot with intuitive UX
- Real-time price monitoring and notifications
- Batch processing for optimal API usage
- Round-robin product verification strategy

### 🏛️ **Enterprise-Grade Architecture**
- **Clean Architecture** with clear separation of concerns
- **Domain-Driven Design** principles
- **SOLID** principles implementation
- Comprehensive test coverage (80%+ requirement)

### ☁️ **AWS-Optimized Infrastructure**
- **DynamoDB** for scalable data storage
- **Lambda** functions for serverless execution
- **S3** for static asset management
- Cost-optimized for Free Tier usage

### 📊 **Advanced Monitoring System**
- Batch processing for Amazon PA-API efficiency
- Smart round-robin verification cycles
- Configurable notification thresholds
- Detailed price history tracking

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Docker** (for local DynamoDB)
- **AWS CLI** (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/itsManeka/gibipromo.git
cd gibipromo

# Install dependencies for all packages
npm install

# Setup environment variables
cp .env.example .env
# Configure your environment variables

# Start local infrastructure
docker compose up -d

# Initialize database tables
node scripts/init-dynamo.js

# Start development server
npm run dev:bot
```

## 📦 Package Architecture

### 🔗 @gibipromo/shared
**Core Types & Utilities**
- Shared TypeScript entities
- Common constants and enums
- Cross-package type definitions
- Utility functions

### 🤖 @gibipromo/telegram-bot
**Primary Application**
- Clean Architecture implementation
- Telegram Bot API integration
- AWS DynamoDB adapters
- Amazon PA-API client with fallback mocks

### 🌐 @gibipromo/web-api
**REST API Server**
- Express.js-based API
- Authentication & authorization
- Product management endpoints
- Statistics and analytics

### 🖥️ @gibipromo/website
**Management Portal**
- React-based dashboard
- Product monitoring interface
- User account management
- Price history visualization

### 🔌 @gibipromo/chrome-extension
**Browser Integration**
- Amazon page enhancement
- One-click product addition
- Price comparison overlays
- Quick monitoring controls

## 🛠️ Development Commands

### Global Commands
```bash
# Development
npm run dev:bot              # Start Telegram bot
npm run dev:api              # Start web API
npm run dev:web              # Start website

# Testing (Always use --maxWorkers=1)
npm test                     # Run all tests
npm run test:coverage        # Generate coverage reports
npm run test:bot             # Test specific package

# Build & Deploy
npm run build                # Build all packages
npm run lint                 # Code quality checks
npm run deploy               # Deploy to AWS
```

### Package-Specific Commands
```bash
# Telegram Bot
npm run dev --workspace=@gibipromo/telegram-bot
npm run test --workspace=@gibipromo/telegram-bot

# Web API
npm run dev --workspace=@gibipromo/web-api
npm run build --workspace=@gibipromo/web-api

# Website
npm run start --workspace=@gibipromo/website
npm run build --workspace=@gibipromo/website
```

## 🤖 Bot Commands Reference

| Command | Description | Usage |
|---------|-------------|-------|
| `/start` | Initialize user account | First-time setup |
| `/enable` | Activate price monitoring | Enable notifications |
| `/disable` | Pause monitoring | Pause notifications |
| `/addlink` | Add products to monitor | Send Amazon URLs |
| `/list` | View monitored products | Product management |
| `/delete` | Remove user account | Account deletion |
| `/help` | Show command reference | Get assistance |

## 🏗️ Technical Implementation

### Clean Architecture Layers

```typescript
src/
├── domain/              # Business Logic
│   ├── entities/        # Core business entities
│   └── usecases/        # Business use cases
├── application/         # Application Logic
│   ├── ports/           # Interface definitions
│   ├── usecases/        # Application services
│   └── factories/       # Dependency injection
└── infrastructure/      # External Integrations
    ├── adapters/        # External service adapters
    ├── config/          # Configuration management
    └── utils/           # Infrastructure utilities
```

### Performance Optimizations

1. **Batch Processing Strategy**
   - Collects up to 10 pending product actions
   - Single PA-API call for multiple products
   - Reduces API rate limits and costs

2. **Round-Robin Verification**
   - DynamoDB pagination with `LastEvaluatedKey`
   - Cyclic product verification ensuring coverage
   - Load balancing across product catalog

3. **Smart Caching**
   - Product data caching strategies
   - Price history compression
   - Minimal AWS resource usage

## 📊 Testing & Quality Assurance

### Test Coverage Requirements
- **Minimum**: 80% code coverage
- **Unit Tests**: All business logic
- **Integration Tests**: External service adapters
- **E2E Tests**: Critical user flows

### Quality Standards
```bash
# Run quality checks
npm run lint                 # ESLint validation
npm run test:coverage        # Coverage reporting
npm run type-check           # TypeScript validation
```

### Code Style
- **Tab indentation** (size: 4)
- **TypeScript strict mode**
- **JSDoc documentation**
- **Conventional Commits**

## 🚀 Deployment & Infrastructure

### AWS Services Configuration
- **Lambda**: Serverless bot execution
- **DynamoDB**: Scalable NoSQL database
- **S3**: Static asset storage
- **CloudWatch**: Monitoring and logging

### Environment Management
```bash
# Development
NODE_ENV=development
USE_MOCK_PAAPI=true

# Production
NODE_ENV=production
USE_MOCK_PAAPI=false
```

## 📈 Roadmap

### Phase 1: Core Platform ✅
- [x] Telegram bot implementation
- [x] Clean Architecture foundation
- [x] AWS integration
- [x] Comprehensive testing

### Phase 2: Web Platform 🚧
- [ ] REST API development
- [ ] React management portal
- [ ] User authentication system
- [ ] Advanced analytics

### Phase 3: Browser Extension 📋
- [ ] Chrome extension development
- [ ] Amazon page integration
- [ ] Cross-platform compatibility
- [ ] Advanced monitoring features

### Phase 4: Enterprise Features 📋
- [ ] Multi-user management
- [ ] Advanced notification options
- [ ] API rate optimization
- [ ] Performance monitoring

## 👨‍💻 Author & Maintainer

**Emanuel Ozorio Dias (itsManeka)**
- 📧 Email: [emanuel.ozoriodias@gmail.com](mailto:emanuel.ozoriodias@gmail.com)
- 🐙 GitHub: [@itsManeka](https://github.com/itsManeka)

### Expertise
- **TypeScript/Node.js** Development
- **Clean Architecture** Implementation
- **AWS Serverless** Solutions
- **Bot Development** & Automation

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Test** thoroughly (`npm test`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

### Contribution Guidelines
- Follow existing code style and architecture
- Maintain test coverage above 80%
- Update documentation for new features
- Ensure all tests pass with `--maxWorkers=1`

## 📄 License

This project is licensed under a **Custom Commercial License**. 

**Key Points:**
- ✅ **Free for personal use**
- ✅ **Open source development**
- ❌ **Commercial use requires permission**
- 💰 **Profit-sharing arrangement for commercial usage**

See the [LICENSE](LICENSE) file for complete terms and conditions.

## 🔗 Links & Resources

- **Repository**: [GitHub](https://github.com/itsManeka/gibipromo)
- **Issues**: [Bug Reports](https://github.com/itsManeka/gibipromo/issues)
- **Discussions**: [Community](https://github.com/itsManeka/gibipromo/discussions)

---

<div align="center">

**Built with ❤️ by [Emanuel Ozorio Dias](https://github.com/itsManeka)**

*Transforming price monitoring into a professional, scalable solution*

</div>