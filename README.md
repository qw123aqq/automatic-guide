# TagoMovie Clone - AI 漫剧创作平台

一个完整的、支持云端和本地 AI 模型的漫剧创作平台克隆版本。

## 🎯 核心功能

- **6 步工作流**：配置 → 故事大纲 → 剧本 → 角色/场景 → 分镜 → 视频/配音
- **4 种创作模式**：整剧模式、逐集模式、画布模式、传统模式
- **6 种创作类型**：故事想法、小说改编、剧本改编、原版剧本、单集故事、单集剧本
- **双模型支持**：云端 AI（豆包、OpenAI、通义）+ 本地模型（Ollama、LocalAI）
- **完整的支付系统**：积分管理、订阅套餐、权限控制

## 📚 技术栈

### 前端
- Vue 3 + TypeScript
- Semi Design UI
- Pinia (状态管理)
- Vite (构建工具)

### 后端
- NestJS + TypeScript
- PostgreSQL
- Redis
- RabbitMQ (消息队列)

### AI/算力
- **LLM**：豆包、OpenAI、通义千问、Ollama、LocalAI
- **图像生成**：Stable Diffusion、ComfyUI
- **视频生成**：Seedance 2.0、本地 FFmpeg
- **TTS**：Azure、阿里云、腾讯云、本地 TTS-1

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 6+

### 安装

```bash
# 克隆项目
git clone https://github.com/qw123aqq/automatic-guide.git
cd automatic-guide

# 安装依赖
cd backend && npm install
cd ../frontend && npm install
cd ..

# 配置环境变量
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 启动 Docker 服务
docker-compose up -d

# 运行数据库迁移
cd backend && npm run migration:run

# 启动开发服务
npm run dev
```

### 访问
- 前端：http://localhost:3001
- 后端 API：http://localhost:3000/api
- API 文档：http://localhost:3000/docs
- RabbitMQ 管理面板：http://localhost:15672 (tagomovie/tagomovie_password)

## 📁 项目结构

```
automatic-guide/
├── backend/                    # NestJS 后端
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/          # 认证模块
│   │   │   ├── projects/      # 项目管理
│   │   │   ├── episodes/      # 剧集管理
│   │   │   ├── ai/            # AI 服务核心
│   │   │   │   ├── llm.service.ts       # LLM 提供商抽象
│   │   │   │   ├── image.service.ts     # 图像生成
│   │   │   │   ├── video.service.ts     # 视频生成
│   │   │   │   └── tts.service.ts       # 文本转语音
│   │   │   ├── payments/      # 支付模块
│   │   │   └── assets/        # 资产中心
│   │   ├── common/            # 通用代码
│   │   ├── database/          # 数据库配置
│   │   └── main.ts
│   ├── package.json
│   └── .env.example
├── frontend/                   # Vue 3 前端
│   ├── src/
│   │   ├── components/        # UI 组件
│   │   ├── pages/             # 页面
│   │   ├── stores/            # Pinia 状态
│   │   ├── services/          # API 服务
│   │   └── App.vue
│   └── package.json
├── docs/                       # 文档
│   ├── API.md                 # API 文档
│   ├── ARCHITECTURE.md         # 架构设计
│   └── AI_MODELS.md           # AI 模型配置
└── docker-compose.yml         # Docker 编排
```

## 🤖 AI 双模型架构

```
前端请求
  ↓
后端检查模型配置
  ├─ 优先使用云端（豆包、OpenAI 等）
  ├─ 云端不可用 → 自动切换到本地（Ollama、ComfyUI）
  └─ 本地也不可用 → 返回错误信息
```

### 支持的 LLM 模型

#### 云端 ☁️
- **豆包** (推荐) - 国内最快
- **OpenAI GPT-4**
- **阿里云通义千问**

#### 本地 💻
- **Ollama** - Llama 2、Mistral
- **LocalAI** - 兼容 OpenAI 的本地部署

### 支持的图像生成

#### 云端 ☁️
- 阿里云灵积
- Replicate

#### 本地 💻
- Stable Diffusion (WebUI / ComfyUI)

### 支持的视频生成

#### 云端 ☁️
- **Seedance 2.0** (付费专属高质量)

#### 本地 💻
- FFmpeg + Frame Interpolation
- Rife (帧插值)

### 支持的 TTS (文本转语音)

#### 云端 ☁️
- Azure 语音服务
- 阿里云 TTS
- 腾讯云 TTS

#### 本地 💻
- TTS-1 (开源)
- Piper (高质量)

## 📋 环境变量配置

### 后端 (.env)

#### 数据库
```env
DATABASE_URL=postgresql://user:password@localhost:5432/tagomovie
REDIS_URL=redis://localhost:6379
```

#### 云端 AI 模型
```env
# 豆包 (推荐)
ZHIPU_API_KEY=your_key

# OpenAI
OPENAI_API_KEY=your_key

# 阿里云
ALIYUN_ACCESS_KEY=your_key
```

#### 本地 AI 模型
```env
OLLAMA_BASE_URL=http://localhost:11434
LOCALAI_BASE_URL=http://localhost:8080
COMFYUI_BASE_URL=http://localhost:8188
```

#### 视频生成
```env
FFMPEG_PATH=/usr/bin/ffmpeg
SEEDANCE_API_KEY=your_key  # 付费
```

#### TTS
```env
AZURE_SPEECH_KEY=your_key
ALIYUN_TTS_KEY=your_key
TENCENT_TTS_KEY=your_key
```

### 前端 (.env)
```env
VITE_API_URL=http://localhost:3000/api
VITE_USE_LOCAL_MODELS=false  # 优先使用云端
VITE_AI_PROVIDER=zhipu       # 默认提供商
```

## 🔧 开发命令

### 后端
```bash
cd backend

# 开发
npm run dev

# 构建
npm run build

# 测试
npm run test

# 数据库迁移
npm run migration:generate
npm run migration:run
npm run migration:revert

# 数据库种子
npm run seed
```

### 前端
```bash
cd frontend

# 开发
npm run dev

# 构建
npm run build

# 预览
npm run preview

# 类型检查
npm run type-check
```

## 🐳 Docker

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重建镜像
docker-compose build --no-cache
```

## 🤖 AI 模型配置指南

### 启用云端模型

1. **豆包 (推��)**
   - 申请地址：https://open.bigmodel.cn/
   - 获取 API Key
   - 配置 `.env`：`ZHIPU_API_KEY=your_key`

2. **OpenAI**
   - 申请地址：https://platform.openai.com/
   - 获取 API Key
   - 配置 `.env`：`OPENAI_API_KEY=your_key`

### 启用本地模型

1. **安装 Ollama**
   ```bash
   # 下载：https://ollama.ai
   # 或 Docker 安装
   docker run -d -p 11434:11434 ollama/ollama
   
   # 拉取模型
   ollama pull llama2
   ollama pull mistral
   ```

2. **启用 ComfyUI (图像生成)**
   ```bash
   docker run -it -p 8188:8188 comfyui:latest
   ```

3. **启用本地 TTS**
   ```bash
   pip install TTS
   python -m TTS.server.server
   ```

## 📚 完整文档

- [API 文档](./docs/API.md) - 所有 API 端点参考
- [架构设计](./docs/ARCHITECTURE.md) - 系统架构和设计决策
- [AI 模型配置](./docs/AI_MODELS.md) - 详细的模型集成指南
- [部署指南](./docs/DEPLOYMENT.md) - 生产环境部署

## 🔐 安全性

- JWT 认证
- 数据加密存储
- API 速率限制
- 内容审核（可选）
- HTTPS 支持
- CORS 配置

## 💳 支付系统

- Stripe 集成
- 支付宝集成
- 积分管理
- 订阅套餐
- 权限控制

## 📊 数据库架构

主要表：
- `users` - 用户信息
- `projects` - 项目
- `episodes` - ���集
- `scripts` - 剧本
- `characters` - 角色
- `scenes` - 场景
- `storyboard_groups` - 分镜组
- `shots` - 镜头
- `render_tasks` - 渲染任务
- `credits` - 积分

详见 [backend/src/database/schema.sql](./backend/src/database/schema.sql)

## 🚀 部署

### 开发环境
```bash
npm run dev
```

### 生产环境
```bash
npm run build
npm run start

# 或使用 Docker
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

## 📞 支持

- 📧 Email: support@tagomovie.local
- 🐛 Issues: https://github.com/qw123aqq/automatic-guide/issues
- 📖 Wiki: https://github.com/qw123aqq/automatic-guide/wiki
