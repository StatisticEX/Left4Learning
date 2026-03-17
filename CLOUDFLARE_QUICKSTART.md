# Cloudflare Analytics 快速启动指南

## 📋 前提条件
- 网站已托管在 Cloudflare Pages
- 拥有 Cloudflare 账户访问权限

---

## 🚀 快速开始（3个步骤）

### 步骤 1：启用 Cloudflare Web Analytics

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧菜单：**Analytics & Logs** → **Web Analytics**
3. 点击 **Add a site** 按钮
4. 输入域名：`l4l.org`
5. 点击 **Add site**
6. 复制生成的 **Beacon Token**（类似：`abc123def456...`）

### 步骤 2：配置 Hugo

编辑 `config/_default/params.toml` 文件：

```toml
[analytics]
  enable = true

  [analytics.cloudflare]
    token = "粘贴你的_Beacon_Token_在这里"
```

### 步骤 3：启用真实数据（可选）

如果你想在统计页面显示真实的访问数据，需要：

#### 3.1 创建 API Token

1. Cloudflare Dashboard → 点击右上角头像 → **My Profile**
2. 左侧菜单 → **API Tokens**
3. 点击 **Create Token**
4. 选择 **Create Custom Token**
5. 配置：
   - **Token name**: `Analytics Read Token`
   - **Permissions**: 添加以下权限
     - Account → Analytics → Read
     - Zone → Analytics → Read
   - **Zone Resources**: Include → Specific zone → 选择 `l4l.org`
6. 点击 **Continue to summary** → **Create Token**
7. **重要**: 复制并保存这个 token（只显示一次）

#### 3.2 获取 Zone ID

1. 在 Cloudflare Dashboard 中选择你的域名 `l4l.org`
2. 在 Overview 页面右侧找到 **Zone ID**
3. 复制这个 ID（类似：`abc123...`）

#### 3.3 创建 Cloudflare Worker

1. Cloudflare Dashboard → **Workers & Pages**
2. 点击 **Create Application** → **Create Worker**
3. 名称：`l4l-analytics-api`
4. 点击 **Deploy**
5. 部署后，点击 **Edit Code**
6. 删除默认代码，粘贴 `cloudflare-worker-simple.js` 的内容
7. 点击 **Save and Deploy**

#### 3.4 配置 Worker 环境变量

1. 在 Worker 页面，点击 **Settings** → **Variables**
2. 点击 **Add variable** 添加以下两个变量：
   - **Variable name**: `CF_API_TOKEN`
     **Value**: 粘贴第 3.1 步的 API Token
     勾选 **Encrypt**（加密）
   - **Variable name**: `CF_ZONE_ID`
     **Value**: 粘贴第 3.2 步的 Zone ID
3. 点击 **Deploy** 保存

#### 3.5 设置 Worker 路由

1. 在 Worker 页面，点击 **Triggers** 标签
2. 在 **Routes** 部分，点击 **Add route**
3. 配置：
   - **Route**: `l4l.org/api/analytics/*`
   - **Zone**: 选择 `l4l.org`
4. 点击 **Add route**

#### 3.6 启用统计页面真实数据

编辑 `layouts/stats/single.html`，找到第 68 行：

```javascript
useRealData: false  // 改为 true
```

改为：

```javascript
useRealData: true  // 启用真实数据
```

---

## ✅ 测试

### 1. 本地测试
```bash
hugo server -D
```
访问：http://localhost:1313/stats/

### 2. 部署测试
```bash
hugo --minify
git add .
git commit -m "Enable Cloudflare Analytics"
git push
```

等待 Cloudflare Pages 部署完成后，访问：https://l4l.org/stats/

---

## 📊 数据说明

### 本地统计数据（始终显示）
- ✅ **文章发布趋势**: 基于 Hugo 文章的真实发布日期
- ✅ **分类分布**: 基于文章的分类数据
- ✅ **标签云**: 基于文章的标签数据

### Cloudflare Analytics 数据（配置 Worker 后显示）
- ✅ **访问趋势**: 近30天的页面浏览量和独立访客
- ✅ **地域分布**: 访客来源国家/地区 TOP 10
- ✅ **来源渠道**: 推荐来源、搜索引擎等

### 数据更新频率
- **本地统计**: 每次部署时更新
- **Cloudflare Analytics**: 实时数据（1-2分钟延迟）

---

## 🔍 故障排查

### 问题：统计页面无法加载

**解决方案**:
```bash
# 检查 Hugo 构建
hugo --minify

# 查看错误信息
hugo server -D --debug
```

### 问题：显示"无法获取数据"

**检查清单**:
- [ ] Worker 是否成功部署？
- [ ] 环境变量是否正确配置？
- [ ] Worker 路由是否正确设置？
- [ ] API Token 是否有正确的权限？

**测试 Worker**:
```bash
# 在浏览器中访问
https://l4l.org/api/analytics/pageviews
```

应该返回 JSON 数据，而不是错误。

### 问题：API Token 权限不足

**解决方案**:
重新创建 API Token，确保包含以下权限：
- Account → Analytics → Read
- Zone → Analytics → Read

---

## 🎯 只想要基础功能？

如果你只需要网站的 **访问统计功能**，不需要统计页面的详细图表：

### 简化配置（推荐）

只需完成**步骤 1** 和**步骤 2**，即：
1. 启用 Cloudflare Web Analytics
2. 在 Hugo 配置中填入 Beacon Token

这样 Cloudflare 会自动开始收集访问数据，你可以在 Cloudflare Dashboard 查看。

统计页面会显示：
- ✅ 真实的文章发布数据
- ✅ 真实的分类和标签分布
- ℹ️ 模拟的访问数据（仅供展示）

---

## 📚 相关文档

- [Cloudflare Web Analytics](https://developers.cloudflare.com/analytics/web-analytics/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare GraphQL Analytics API](https://developers.cloudflare.com/analytics/graphql-api/)

---

## 💡 提示

1. **隐私友好**: Cloudflare Web Analytics 不使用 cookies，符合 GDPR
2. **完全免费**: Web Analytics 和 Workers（免费计划）都是免费的
3. **无需第三方**: 不依赖 Google Analytics 等第三方服务
4. **快速部署**: Worker 部署通常在几秒内完成
5. **实时数据**: 数据延迟仅 1-2 分钟

---

如有问题，请查看 `cloudflare-analytics-setup.md` 获取详细配置说明。
