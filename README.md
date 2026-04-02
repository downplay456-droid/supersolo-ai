# SuperSolo AI

> 跨境电商选品全链路自动化平台 · 零经验挖掘全球爆款 · AI驱动营销文案生成
> Cross-border e-commerce product selection automation platform powered by AI

![TypeScript](https://img.shields.io/badge/TypeScript-98%25-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2-green)
![Supabase](https://img.shields.io/badge/Supabase-Auth-orange)
![DeepSeek](https://img.shields.io/badge/DeepSeek-AI-purple)
![version](https://img.shields.io/badge/version-v1.2.0-brightgreen)
![node](https://img.shields.io/badge/node-%3E%3D18.0.0-yellow)
![license](https://img.shields.io/badge/license-MIT-green)

AI-powered cross-border e-commerce product selection platform that automates the entire process from trending product discovery to high-conversion marketing copy generation. Support multi-platform data aggregation (TikTok Shop, Amazon, Reddit), intelligent potential scoring, and one-click AI copy generation.

专为跨境卖家打造的全链路选品工具，自动聚合全球多平台爆款数据，通过多维度算法评估产品潜力，结合DeepSeek大模型一键生成高转化率营销文案，零基础也能快速挖掘爆品。

## Highlights

- **🔥 Full Product Selection Workflow** — Complete product selection process from data collection to intelligent recommendation, support filtering by category, price range, and multi-dimensional sorting.
- **🤖 AI Copy Generation Integration** — One-click generate high-conversion marketing copy directly from product cards, optimized for cross-border e-commerce scenarios.
- **🌍 Multi-Market Adaptation** — Support switching between different national markets, automatic currency and regional preference adaptation.
- **📊 Intelligent Potential Scoring** — 4-dimensional weighted scoring algorithm (sales growth 40%, social popularity 30%, price health 15%, competition 15%), non-linear scoring improves differentiation.
- **🔌 Multi-Platform API Support** — Built-in support for TikTok Shop, Amazon Product Advertising API, Reddit community data acquisition, automatic fallback to mock data when credentials are missing.
- **💾 Smart Caching Mechanism** — Two-tier data storage (database + third-party API), automatically caches crawled data to improve response speed and reduce API calls.
- **🎨 Modern UI Design** — Strong Bold design style, high contrast, clear information hierarchy, excellent user experience.
- **🔒 Enterprise-Grade Security** — Supabase authentication with RLS row-level security, user data isolation, no credential leakage risk.
- **⚡ Production Ready** — 100% stable production build, complete logging and error handling mechanism, can be directly deployed online.

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- Supabase project (for database and authentication)
- DeepSeek API key (for AI copy generation)
- Optional: TikTok Shop/Amazon/Reddit API keys (for real product data)

### Installation
```bash
# Clone the repository
git clone https://github.com/downplay456-droid/supersolo-ai.git
cd supersolo-ai

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local and fill in your Supabase and API credentials

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

### Environment Configuration
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# DeepSeek AI Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key

# Third-party API (Optional)
TIKTOK_SHOP_API_KEY=your_tiktok_api_key
AMAZON_ACCESS_KEY=your_amazon_access_key
REDDIT_CLIENT_ID=your_reddit_client_id

# API Source Configuration (mock/tiktok/amazon/reddit)
NEXT_PUBLIC_API_SOURCE=mock
```

## Core Modules

### 1. Product Discovery Module
- Multi-platform data aggregation
- Intelligent filtering and sorting
- Product potential score calculation
- Favorite and product library management

### 2. AI Copy Generation Module
- DeepSeek LLM integration
- Product feature extraction
- Cross-border e-commerce copy optimization
- Multi-language support

### 3. Market Analysis Module
- Multi-country market switching
- Regional preference analysis
- Price trend prediction
- Competition analysis

### 4. User System
- Supabase authentication
- User preference configuration
- Data synchronization across devices
- Permission management

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 + TypeScript + TailwindCSS + shadcn/ui |
| Backend | Next.js API Routes + Supabase Edge Functions |
| Database | Supabase PostgreSQL + RLS |
| AI Engine | DeepSeek V3 Large Language Model |
| Data Sources | TikTok Shop API / Amazon PAAPI / Reddit API |
| Deployment | Vercel / Docker / Any Node.js hosting |

## Deployment

### One-click Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/downplay456-droid/supersolo-ai)

### Docker Deployment
```bash
docker build -t supersolo-ai .
docker run -p 3000:3000 --env-file .env.local supersolo-ai
```

## Roadmap

- [ ] v1.3.0 - Price comparison module + 1688/Alibaba API integration
- [ ] v1.4.0 - Logistics inquiry and cost calculation module
- [ ] v1.5.0 - Self-developed crawler system for multi-platform data acquisition
- [ ] v1.6.0 - Sales prediction algorithm + supply chain recommendation
- [ ] v2.0.0 - Multi-user team collaboration + subscription payment system

## Release Notes

### v1.2.0 (2026-04-02)
- ✅ Complete product selection function launch
- ✅ Third-party API docking framework completed
- ✅ Product potential scoring algorithm optimization
- ✅ Product data and AI copy generation integration
- ✅ All production build issues fixed, 100% stability

### v1.1.5 (2026-04-01)
- ✅ Basic architecture stabilization
- ✅ Authentication system completion
- ✅ UI style unification

### v1.0.0 (2026-03-16)
- ✅ Initial version release
- ✅ Next.js + TypeScript foundation
- ✅ AI copy generation function

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions, issues and feature requests are welcome! Feel free to check [issues page](https://github.com/downplay456-droid/supersolo-ai/issues) if you want to contribute.

---

**Built with ❤️ for cross-border sellers worldwide**
