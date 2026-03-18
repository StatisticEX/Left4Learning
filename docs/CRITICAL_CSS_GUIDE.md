# Critical CSS 优化指南

Critical CSS（关键CSS）优化是一种提升首屏渲染速度的技术，将首屏渲染所需的关键CSS内联到HTML中，其余CSS异步加载。

## 当前配置

项目已经配置了以下优化：

1. **CSS预加载** - 在 `layouts/partials/head/custom.html` 中
   ```html
   <link rel="preload" href="/css/main.min.css" as="style">
   <link rel="preload" href="/css/style.min.css" as="style">
   ```

2. **CSS压缩** - Hugo在构建时自动压缩CSS（`hugo --minify`）

## 如何进一步优化 Critical CSS

### 方法1: 使用在线工具提取

1. 部署网站后访问以下工具：
   - https://www.sitelocity.com/critical-path-css-generator
   - https://jonassebastianohlsson.com/criticalpathcssgenerator/

2. 输入网站URL，工具会自动提取首屏CSS

3. 将提取的CSS保存到 `layouts/partials/head/critical-css.html`:
   ```html
   <style>
   /* Critical CSS - 首屏关键样式 */
   /* 在这里粘贴提取的CSS */
   </style>
   ```

4. 在 `layouts/baseof.html` 的 head 中引入:
   ```html
   {{- partial "head/critical-css.html" . -}}
   ```

5. 将原CSS改为异步加载:
   ```html
   <link rel="preload" href="/css/main.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
   <link rel="preload" href="/css/style.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
   <noscript>
     <link rel="stylesheet" href="/css/main.min.css">
     <link rel="stylesheet" href="/css/style.min.css">
   </noscript>
   ```

### 方法2: 使用命令行工具

```bash
# 安装 critical
npm install -g critical

# 提取Critical CSS
critical https://l4l.org --inline --minify > critical.css
```

### 方法3: 自动化构建流程

在Hugo构建后自动提取和内联Critical CSS：

```bash
# package.json
{
  "scripts": {
    "build": "hugo --minify && npm run critical",
    "critical": "critical public/index.html --inline --minify"
  }
}
```

## 性能提升预期

- **首屏渲染时间**: 减少 30-50%
- **First Contentful Paint (FCP)**: 改善 200-500ms
- **Largest Contentful Paint (LCP)**: 改善 300-800ms

## 注意事项

1. **定期更新**: 网站样式变化后需重新提取Critical CSS
2. **体积控制**: Critical CSS应控制在 14KB 以内（TCP慢启动限制）
3. **测试验证**: 提取后需在多种设备和浏览器测试
4. **权衡取舍**: 对于小型网站，可能不值得投入精力优化

## 当前配置已足够

对于您的博客网站，当前的优化配置（CDN、预加载、压缩）已经能够提供良好的性能。
Critical CSS内联更适合：
- 大型复杂网站
- 首屏渲染时间 > 3秒的网站
- 有明确性能瓶颈的场景

## 推荐的性能监控

启用 Web Vitals 监控（在 `params.toml` 中）：
```toml
[analytics.webVitals]
  enable = true
  console = true
```

然后在浏览器控制台查看实际性能指标，决定是否需要进一步优化。
