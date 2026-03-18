// Core Web Vitals 监控脚本
// 使用 web-vitals 库监控页面性能指标

(function() {
  // 如果已加载 web-vitals，则使用它
  if (window.webVitals) {
    // LCP - Largest Contentful Paint
    webVitals.onLCP(function(metric) {
      sendToAnalytics('LCP', metric.value, metric.rating);
    });

    // FID - First Input Delay
    webVitals.onFID(function(metric) {
      sendToAnalytics('FID', metric.value, metric.rating);
    });

    // CLS - Cumulative Layout Shift
    webVitals.onCLS(function(metric) {
      sendToAnalytics('CLS', metric.value, metric.rating);
    });

    // FCP - First Contentful Paint
    webVitals.onFCP(function(metric) {
      sendToAnalytics('FCP', metric.value, metric.rating);
    });

    // TTFB - Time to First Byte
    webVitals.onTTFB(function(metric) {
      sendToAnalytics('TTFB', metric.value, metric.rating);
    });
  }

  // 发送到分析服务的函数
  function sendToAnalytics(metricName, value, rating) {
    // 输出到控制台（开发环境）
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('[Web Vitals]', metricName, {
        value: value,
        rating: rating,
        threshold: getThreshold(metricName)
      });
    }

    // 可以在这里添加发送到 Google Analytics 或其他分析服务的代码
    // 例如: gtag('event', metricName, { value: Math.round(value), metric_rating: rating });
  }

  // 获取各指标的阈值
  function getThreshold(metricName) {
    const thresholds = {
      'LCP': { good: 2500, needsImprovement: 4000 },
      'FID': { good: 100, needsImprovement: 300 },
      'CLS': { good: 0.1, needsImprovement: 0.25 },
      'FCP': { good: 1800, needsImprovement: 3000 },
      'TTFB': { good: 800, needsImprovement: 1800 }
    };
    return thresholds[metricName] || {};
  }

  // 加载 web-vitals 库（可选，如果需要的话）
  function loadWebVitals() {
    if (!window.webVitals) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/web-vitals@3/dist/web-vitals.iife.js';
      script.async = true;
      script.onload = function() {
        // 库加载完成后重新执行监控
        if (window.webVitals) {
          console.log('[Web Vitals] Library loaded successfully');
        }
      };
      document.head.appendChild(script);
    }
  }

  // 取消注释下面这行以启用 web-vitals 库
  // loadWebVitals();
})();
