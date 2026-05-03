# 🍜 今天吃什么

选择困难症救星！根据你的预算和位置，每天随机推荐附近好评美食。

## 功能特性

- 🎯 **每日随机推荐** — 基于日期 + 用户 ID 生成确定性随机种子，同一天同一用户看到相同推荐
- 🍳 **随机菜系** — 每次推荐前先随机选择一种菜系（火锅、日料、川湘菜等 16 种），再搜索附近餐厅
- 💰 **价格筛选** — 支持预设价格区间 + 自定义，无结果时自动放宽 20%
- 📍 **自动定位** — 浏览器 GPS 定位，拒绝时支持手动输入地址 + 高德地理编码
- ⭐ **综合评分** — 评分 40% / 距离 20% / 价格匹配 20% / 菜系匹配 10% / 新鲜度 10%
- 🏆 **加权随机主推** — 从前 5 名中按评分加权随机选出今日主推，不总是第一名
- ❤️ **收藏 / 不感兴趣** — 个性化偏好记录，影响后续推荐
- 📱 **移动端适配** — 响应式设计，移动端优先

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 数据库 | SQLite + Prisma ORM |
| 地图 | 高德 Web Service API (POI 周边搜索) |
| 部署 | Vercel / 任意 Node.js 环境 |

## 快速开始

### 1. 克隆并安装依赖

```bash
cd what-to-eat
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的高德 API Key：

```
AMAP_API_KEY=你的高德Web服务Key
DATABASE_URL="file:./dev.db"
```

> 获取 Key: https://lbs.amap.com/ → 应用管理 → 创建应用 → 添加 Web服务 API Key

### 3. 初始化数据库

```bash
npx prisma db push
```

### 4. 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000

## 项目结构

```
what-to-eat/
├── prisma/
│   └── schema.prisma              # 数据库模型
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── recommend/route.ts # POST 推荐接口
│   │   │   ├── dislike/route.ts   # POST 不感兴趣
│   │   │   ├── favorite/route.ts  # POST 收藏/取消收藏
│   │   │   ├── history/route.ts   # GET  推荐历史
│   │   │   └── geocode/route.ts   # POST 地址转经纬度
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx               # 主页面
│   ├── components/
│   │   ├── ui/                    # 基础 UI 组件
│   │   ├── PriceRangeSelector.tsx
│   │   ├── LocationInput.tsx
│   │   ├── RecommendationCard.tsx
│   │   └── RestaurantList.tsx
│   ├── lib/
│   │   ├── prisma.ts              # Prisma 客户端
│   │   ├── recommendation.ts      # 推荐引擎核心
│   │   ├── cuisine.ts             # 菜系定义 & 随机算法
│   │   ├── utils.ts               # 工具函数
│   │   └── providers/
│   │       ├── types.ts           # Provider 接口
│   │       ├── amap.ts            # 高德 Provider
│   │       └── dianping.ts        # 大众点评预留（未实现）
│   └── types/
│       └── index.ts               # 类型定义
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## API 文档

### POST /api/recommend

请求体：
```json
{
  "userId": "user_xxx",
  "priceMin": 30,
  "priceMax": 50,
  "latitude": 39.9042,
  "longitude": 116.4074
}
```

响应：
```json
{
  "cuisineType": "🍲 火锅",
  "topPick": {
    "id": "B0FFF...",
    "name": "海底捞火锅",
    "rating": 4.5,
    "avgPrice": 45,
    "distance": 800,
    "score": 85.5,
    "scoreBreakdown": { "rating": 35, "distance": 12, "priceMatch": 18, "cuisineMatch": 10, "freshness": 10 },
    "reason": "评分很高，价格合适，菜系匹配度高",
    "isFavorite": false
  },
  "restaurants": [...],
  "relaxed": false
}
```

### POST /api/dislike
```json
{ "userId": "user_xxx", "restaurantId": "B0FFF..." }
```

### POST /api/favorite
```json
{ "userId": "user_xxx", "restaurantId": "B0FFF...", "action": "add|remove" }
```

### GET /api/history?userId=user_xxx&limit=20

### POST /api/geocode
```json
{ "address": "朝阳大悦城" }
```

## 数据库模型

| 表 | 用途 |
|----|------|
| UserPreference | 用户偏好（价格、位置） |
| RestaurantCache | 店铺缓存 |
| RecommendationHistory | 推荐历史 |
| DislikedRestaurant | 用户不喜欢的店 |
| FavoriteRestaurant | 用户收藏的店 |

## Provider 模式

使用 Provider 模式抽象数据源，方便后续切换或扩展：

- **AmapProvider** — 已实现，调用高德 POI 周边搜索
- **DianpingOfficialProvider** — 预留接口，等待大众点评开放 API 后实现

## License

MIT
