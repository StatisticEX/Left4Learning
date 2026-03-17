# Cloudflare Analytics 集成指南

本指南将帮助你为网站集成 Cloudflare Analytics，获取真实的访问统计数据。

## 第一步：启用 Cloudflare Web Analytics

### 1.1 获取 Web Analytics Token

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 在左侧菜单找到 **Analytics & Logs** > **Web Analytics**
3. 点击 **Add a site**
4. 输入网站域名 `l4l.org` 并点击 **Add site**
5. 复制生成的 **Beacon token**（类似：`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）

### 1.2 配置 Hugo

编辑 `config/_default/params.toml`，找到 Cloudflare Analytics 部分：

```toml
[analytics]
  enable = true  # 启用分析功能

  [analytics.cloudflare]
    token = "你的_Beacon_Token"  # 粘贴刚才复制的 token
```

## 第二步：创建 Cloudflare Worker（获取详细统计数据）

### 2.1 创建 API Token

要从 Cloudflare GraphQL API 获取详细数据，需要创建 API Token：

1. 在 Cloudflare Dashboard 中，点击右上角的头像
2. 选择 **My Profile** > **API Tokens**
3. 点击 **Create Token**
4. 选择 **Create Custom Token**，配置如下：
   - **Token name**: `Analytics Read Token`
   - **Permissions**:
     - Account > Analytics > Read
     - Zone > Analytics > Read
   - **Zone Resources**: 选择你的域名 `l4l.org`
5. 点击 **Continue to summary** > **Create Token**
6. 复制生成的 token（只会显示一次，请妥善保存）

### 2.2 创建 Cloudflare Worker

1. 在 Cloudflare Dashboard 中，选择 **Workers & Pages**
2. 点击 **Create Application** > **Create Worker**
3. 命名为 `l4l-analytics-api`
4. 点击 **Deploy**
5. 点击 **Edit code**
6. 将 `worker.js` 文件中的代码替换为项目中的 `cloudflare-worker-analytics.js` 内容
7. 点击 **Save and Deploy**

### 2.3 配置 Worker 环境变量

1. 在 Worker 页面，点击 **Settings** > **Variables**
2. 添加以下环境变量：
   - **CF_API_TOKEN**: 粘贴第 2.1 步创建的 API Token
   - **CF_ZONE_ID**: 你的 Zone ID（在域名 Overview 页面右侧可以找到）
   - **CF_ACCOUNT_ID**: 你的 Account ID（在域名 Overview 页面右侧可以找到）
3. 点击 **Save and Deploy**

### 2.4 设置 Worker 路由

1. 在 Worker 页面，点击 **Triggers** > **Routes**
2. 点击 **Add route**
3. 配置路由：
   - **Route**: `l4l.org/api/analytics/*`
   - **Worker**: 选择 `l4l-analytics-api`
4. 点击 **Save**

## 第三步：更新网站配置

编辑 `content/stats/index.md` 的 front matter：

```yaml
---
title: "网站统计"
date: 2026-03-17
draft: false
type: "stats"
layout: "single"
params:
  analytics:
    enabled: true
    apiEndpoint: "/api/analytics"  # 如果使用 Worker
    # 或者使用完整 URL
    # apiEndpoint: "https://l4l-analytics-api.你的账户名.workers.dev"
---
```

## 第四步：测试

1. 构建并部署网站：
   ```bash
   hugo --minify
   git add .
   git commit -m "Add Cloudflare Analytics integration"
   git push
   ```

2. 等待 Cloudflare Pages 部署完成

3. 访问 `https://l4l.org/stats/` 查看统计数据

## 数据说明

Cloudflare Analytics 提供的数据包括：

- ✅ **页面浏览量（Pageviews）**: 实时页面访问数据
- ✅ **访客数（Unique Visitors）**: 去重后的访客统计
- ✅ **地域分布**: 访客国家/地区分布
- ✅ **来源渠道**: 推荐来源、搜索引擎等
- ✅ **浏览器/设备**: 访客使用的浏览器和设备类型
- ⚠️ **文章阅读量**: 需要自定义事件追踪

## 注意事项

1. **数据延迟**: Cloudflare Analytics 数据通常有 1-2 分钟的延迟
2. **历史数据**: 从启用 Web Analytics 开始才会收集数据
3. **隐私保护**: Cloudflare Analytics 符合 GDPR 要求，不使用 cookies
4. **免费额度**: Web Analytics 完全免费，无限制

## 可选：高级功能

### 追踪自定义事件（文章阅读量）

在文章页面添加自定义事件追踪：

```javascript
// 在文章页面底部添加
if (typeof cloudflare !== 'undefined' && cloudflare.analytics) {
  cloudflare.analytics.track('article_view', {
    article_title: '{{ .Title }}',
    article_category: '{{ .Params.categories }}',
  });
}
```

## 故障排查

### 问题1：统计页面显示"无法获取数据"

**解决方案**:
- 检查 Worker 是否部署成功
- 检查环境变量是否配置正确
- 查看浏览器控制台的错误信息
- 检查 Worker 的日志（Dashboard > Workers > 选择 worker > Logs）

### 问题2：数据不更新

**解决方案**:
- Cloudflare Analytics 有 1-2 分钟延迟，等待后刷新
- 检查 Web Analytics token 是否正确配置
- 确认网站已部署并有访问流量

### 问题3：CORS 错误

**解决方案**:
- 确保 Worker 代码中包含正确的 CORS 头
- 或使用相对路径 `/api/analytics` 而非完整 Worker URL

## 相关链接

- [Cloudflare Web Analytics 文档](https://developers.cloudflare.com/analytics/web-analytics/)
- [Cloudflare GraphQL Analytics API 文档](https://developers.cloudflare.com/analytics/graphql-api/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
