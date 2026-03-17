# 网站统计功能说明

## 📊 功能概览

已成功为网站添加了完整的统计功能页面，位于 `/stats/` 路径。

### 统计维度

1. **📅 文章发布趋势** - 近12个月发布热力图
2. **🏷️ 分类与标签分布** - 饼图 + 词云
3. **📈 近30天访问趋势** - 页面浏览量和独立访客
4. **🌍 访客地域分布** - TOP 10 国家/地区
5. **📊 来源渠道占比** - 流量来源分析

## 📁 创建的文件

### 核心文件
```
content/stats/index.md              # 统计页面内容
layouts/stats/single.html           # 统计页面模板（支持真实/模拟数据）
config/_default/menus.toml          # 已更新菜单配置
```

### Cloudflare Worker 文件
```
cloudflare-worker-simple.js         # 简化版 Worker（推荐）
cloudflare-worker-analytics.js      # 完整版 Worker（高级功能）
```

### 文档文件
```
CLOUDFLARE_QUICKSTART.md            # 快速启动指南 ⭐ 从这里开始
cloudflare-analytics-setup.md       # 详细配置指南
README_STATS.md                     # 本文件
```

## 🚀 如何使用

### 方案 A：使用模拟数据（即刻可用）

**当前状态 ✅**

统计页面已经可以使用，显示：
- ✅ 真实的文章统计数据（发布趋势、分类、标签）
- ℹ️ 模拟的访问数据（仅供展示）

直接访问 `/stats/` 即可查看。

### 方案 B：接入真实数据（推荐）

按照 `CLOUDFLARE_QUICKSTART.md` 的步骤操作：

1. **基础配置（5分钟）**
   - 启用 Cloudflare Web Analytics
   - 配置 Beacon Token

2. **高级配置（15分钟）**
   - 创建 API Token
   - 部署 Cloudflare Worker
   - 配置环境变量和路由

完成后可显示：
- ✅ 真实的文章统计
- ✅ 真实的访问数据
- ✅ 真实的地域分布
- ✅ 真实的来源渠道

## 🎨 特性

### 技术栈
- **ECharts 5.4.3** - 专业的数据可视化库
- **Cloudflare Workers** - 边缘计算，全球加速
- **GraphQL API** - 高效的数据查询

### 用户体验
- ✅ 响应式设计，支持移动端
- ✅ 亮色/暗色主题自动适配
- ✅ 图表动画效果
- ✅ 数据来源说明
- ✅ 窗口自适应调整

### 性能优化
- ✅ CDN 加速的 JS 库
- ✅ 按需加载数据
- ✅ 缓存友好

## 📊 数据来源

| 统计项 | 数据来源 | 是否真实 |
|--------|---------|---------|
| 文章发布趋势 | Hugo 文章元数据 | ✅ 真实 |
| 分类分布 | Hugo 文章分类 | ✅ 真实 |
| 标签云 | Hugo 文章标签 | ✅ 真实 |
| 访问趋势 | Cloudflare Analytics | 🔧 需配置 |
| 地域分布 | Cloudflare Analytics | 🔧 需配置 |
| 来源渠道 | Cloudflare Analytics | 🔧 需配置 |

## 🔧 配置选项

### 启用真实数据

编辑 `layouts/stats/single.html` 第 68 行：

```javascript
const CONFIG = {
    apiEndpoint: '/api/analytics',  // Worker API 端点
    useRealData: true  // 改为 true 启用真实数据
};
```

### 自定义 API 端点

如果使用独立的 Worker URL：

```javascript
const CONFIG = {
    apiEndpoint: 'https://your-worker.workers.dev',
    useRealData: true
};
```

## 📱 访问页面

- **本地开发**: http://localhost:1313/stats/
- **生产环境**: https://l4l.org/stats/

## 🔍 故障排查

### 页面无法访问
```bash
# 检查构建
hugo --minify

# 查看详细日志
hugo server -D --debug
```

### Worker 无法连接
```bash
# 测试 API 端点
curl https://l4l.org/api/analytics/pageviews

# 检查 Worker 日志
# Cloudflare Dashboard → Workers → 选择 worker → Logs
```

### 数据不更新
- 检查 Cloudflare Analytics 是否已启用
- 确认 Beacon Token 配置正确
- 等待 1-2 分钟（数据有延迟）

## 📖 更多信息

- **快速开始**: 查看 `CLOUDFLARE_QUICKSTART.md`
- **详细配置**: 查看 `cloudflare-analytics-setup.md`
- **技术支持**: [Cloudflare Community](https://community.cloudflare.com/)

## 🎯 下一步

1. ✅ 统计页面已创建
2. ⏭️ 按照快速指南配置 Cloudflare Analytics
3. ⏭️ 部署到生产环境
4. ⏭️ 查看真实的统计数据

## 🙏 反馈

如有问题或建议，欢迎提出 Issue！
