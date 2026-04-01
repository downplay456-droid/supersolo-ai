# SuperSolo AI 发布日志
---
## v1.1.0 (2026-04-01)
### 🚀 版本说明
MVP核心功能第一个开发迭代版本，完成选品模块基础数据层和核心入口组件。

### ✅ 主要更新内容
#### 1. 数据库层
- 完成选品相关8张核心表结构设计：`countries`/`platforms`/`products`/`product_price_history`/`product_supplier_prices`/`user_product_favorites`/`user_product_tags`/`user_product_tag_relations`
- 新增业务支撑表：`crawl_tasks`爬虫任务管理表、`market_config`市场配置表
- 完善数据库索引优化、RLS行级安全策略、自动更新时间触发器
- 导入初始数据：7个主流国家配置、10个主流平台配置

#### 2. 功能模块
- 完成目标国家选择组件开发，支持从Supabase动态加载国家列表
- 重构`CountryContext`全局状态管理，支持状态持久化、加载/错误状态处理
- 新增`/api/countries`API接口，提供国家数据查询能力
- 国家切换自动同步全局状态，支持用户选择记忆功能

### 🔧 技术优化
- 完善Git版本控制体系，建立分支管理规范
- 完成Supabase本地数据库初始化和迁移配置
- 前端组件采用深色科技风设计，符合商业级SaaS标准

### 📋 影响范围
- 所有后续模块都需要依赖本次开发的国家选择组件和全局状态
- 选品模块、爬虫模块、比价模块的数据层基础已完成

### ⏪ 回滚方案
- 版本哈希：`923a1be`
- 回滚命令：`git revert 923a1be 35cc3ca 0b3d082`
- 回滚后恢复到初始v1.0.0版本状态

---
## v1.0.0 (2026-04-01)
### 🚀 版本说明
项目初始基础版本，包含完整的工程化架构。

### ✅ 已完成基础能力
- Next.js 14 App Router 基础架构 + TypeScript
- Supabase用户认证系统 + RLS行级安全
- 完整响应式深色主题 + shadcn/ui组件库
- 所有基础页面路由（Dashboard/Products/Settings/登录/注册）
- DeepSeek AI文案生成功能完整可用
- 交互体验优化（Loading状态 + Toast通知 + 骨架屏）
- 全局异常处理 + 404问题修复
