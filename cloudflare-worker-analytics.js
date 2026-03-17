/**
 * Cloudflare Worker for Analytics API
 *
 * 这个 Worker 提供一个 API 端点来获取 Cloudflare Analytics 数据
 * 部署到 Cloudflare Workers 后，可以从网站前端调用来获取统计数据
 */

// 配置（使用环境变量）
const CONFIG = {
  // 从环境变量获取，在 Worker Dashboard 中配置
  CF_API_TOKEN: '', // Cloudflare API Token (Analytics:Read 权限)
  CF_ZONE_ID: '',   // Zone ID (在域名 Overview 页面可以找到)
  CF_ACCOUNT_ID: '' // Account ID (在域名 Overview 页面可以找到)
};

// CORS 头
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

/**
 * 处理请求
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // 处理 CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  // 只允许 GET 请求
  if (request.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: CORS_HEADERS
    });
  }

  // 从环境变量获取配置
  const apiToken = CONFIG.CF_API_TOKEN || request.headers.get('CF-API-TOKEN');
  const zoneId = CONFIG.CF_ZONE_ID || url.searchParams.get('zoneId');
  const accountId = CONFIG.CF_ACCOUNT_ID || url.searchParams.get('accountId');

  if (!apiToken || !zoneId) {
    return jsonResponse({
      error: 'Missing required parameters: CF_API_TOKEN or CF_ZONE_ID'
    }, 400);
  }

  // 路由处理
  const path = url.pathname;

  try {
    if (path.endsWith('/overview')) {
      return await getOverview(apiToken, zoneId, accountId);
    } else if (path.endsWith('/pageviews')) {
      return await getPageviews(apiToken, zoneId);
    } else if (path.endsWith('/countries')) {
      return await getCountries(apiToken, zoneId);
    } else if (path.endsWith('/referrers')) {
      return await getReferrers(apiToken, zoneId);
    } else if (path.endsWith('/browsers')) {
      return await getBrowsers(apiToken, zoneId);
    } else if (path.endsWith('/popular-pages')) {
      return await getPopularPages(apiToken, zoneId);
    } else {
      return jsonResponse({
        error: 'Unknown endpoint',
        availableEndpoints: [
          '/overview - 总览数据',
          '/pageviews - 页面浏览趋势',
          '/countries - 地域分布',
          '/referrers - 来源渠道',
          '/browsers - 浏览器分布',
          '/popular-pages - 热门页面'
        ]
      }, 404);
    }
  } catch (error) {
    return jsonResponse({
      error: 'Failed to fetch analytics data',
      message: error.message
    }, 500);
  }
}

/**
 * 获取总览数据
 */
async function getOverview(apiToken, zoneId, accountId) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const query = `
    query {
      viewer {
        zones(filter: {zoneTag: "${zoneId}"}) {
          httpRequests1dGroups(
            limit: 1,
            filter: {
              date_gt: "${thirtyDaysAgo.toISOString().split('T')[0]}"
            }
          ) {
            sum {
              requests
              pageViews
            }
            uniq {
              uniques
            }
          }
        }
      }
    }
  `;

  const result = await queryGraphQL(apiToken, query);

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  const data = result.data.viewer.zones[0].httpRequests1dGroups[0];

  return jsonResponse({
    totalPageviews: data.sum.pageViews || 0,
    totalVisitors: data.uniq.uniques || 0,
    totalRequests: data.sum.requests || 0,
    period: '30 days'
  });
}

/**
 * 获取页面浏览趋势（近30天）
 */
async function getPageviews(apiToken, zoneId) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const query = `
    query {
      viewer {
        zones(filter: {zoneTag: "${zoneId}"}) {
          httpRequests1dGroups(
            limit: 30,
            filter: {
              date_gt: "${thirtyDaysAgo.toISOString().split('T')[0]}"
            },
            orderBy: [date_ASC]
          ) {
            dimensions {
              date
            }
            sum {
              pageViews
            }
            uniq {
              uniques
            }
          }
        }
      }
    }
  `;

  const result = await queryGraphQL(apiToken, query);

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  const groups = result.data.viewer.zones[0].httpRequests1dGroups;

  const dates = groups.map(g => g.dimensions.date);
  const pageviews = groups.map(g => g.sum.pageViews || 0);
  const visitors = groups.map(g => g.uniq.uniques || 0);

  return jsonResponse({
    dates,
    pageviews,
    visitors
  });
}

/**
 * 获取地域分布（Top 20 国家）
 */
async function getCountries(apiToken, zoneId) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const query = `
    query {
      viewer {
        zones(filter: {zoneTag: "${zoneId}"}) {
          httpRequests1dGroups(
            limit: 20,
            filter: {
              date_gt: "${thirtyDaysAgo.toISOString().split('T')[0]}"
            },
            orderBy: [sum_pageViews_DESC]
          ) {
            dimensions {
              clientCountryName
            }
            sum {
              pageViews
            }
            uniq {
              uniques
            }
          }
        }
      }
    }
  `;

  const result = await queryGraphQL(apiToken, query);

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  const groups = result.data.viewer.zones[0].httpRequests1dGroups;

  const countries = groups
    .filter(g => g.dimensions.clientCountryName)
    .map(g => ({
      name: g.dimensions.clientCountryName,
      pageviews: g.sum.pageViews || 0,
      visitors: g.uniq.uniques || 0
    }));

  return jsonResponse({ countries });
}

/**
 * 获取来源渠道（Top 20）
 */
async function getReferrers(apiToken, zoneId) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const query = `
    query {
      viewer {
        zones(filter: {zoneTag: "${zoneId}"}) {
          httpRequests1dGroups(
            limit: 20,
            filter: {
              date_gt: "${sevenDaysAgo.toISOString().split('T')[0]}"
            },
            orderBy: [sum_pageViews_DESC]
          ) {
            dimensions {
              refererHost
            }
            sum {
              pageViews
            }
          }
        }
      }
    }
  `;

  const result = await queryGraphQL(apiToken, query);

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  const groups = result.data.viewer.zones[0].httpRequests1dGroups;

  const referrers = groups
    .filter(g => g.dimensions.refererHost)
    .map(g => ({
      name: g.dimensions.refererHost || 'Direct',
      value: g.sum.pageViews || 0
    }));

  return jsonResponse({ referrers });
}

/**
 * 获取浏览器分布
 */
async function getBrowsers(apiToken, zoneId) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const query = `
    query {
      viewer {
        zones(filter: {zoneTag: "${zoneId}"}) {
          httpRequests1dGroups(
            limit: 10,
            filter: {
              date_gt: "${sevenDaysAgo.toISOString().split('T')[0]}"
            },
            orderBy: [sum_pageViews_DESC]
          ) {
            dimensions {
              clientDeviceType
            }
            sum {
              pageViews
            }
          }
        }
      }
    }
  `;

  const result = await queryGraphQL(apiToken, query);

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  const groups = result.data.viewer.zones[0].httpRequests1dGroups;

  const browsers = groups
    .filter(g => g.dimensions.clientDeviceType)
    .map(g => ({
      name: g.dimensions.clientDeviceType,
      value: g.sum.pageViews || 0
    }));

  return jsonResponse({ browsers });
}

/**
 * 获取热门页面（Top 10）
 */
async function getPopularPages(apiToken, zoneId) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const query = `
    query {
      viewer {
        zones(filter: {zoneTag: "${zoneId}"}) {
          httpRequests1dGroups(
            limit: 10,
            filter: {
              date_gt: "${sevenDaysAgo.toISOString().split('T')[0]}"
            },
            orderBy: [sum_pageViews_DESC]
          ) {
            dimensions {
              requestPath
            }
            sum {
              pageViews
            }
          }
        }
      }
    }
  `;

  const result = await queryGraphQL(apiToken, query);

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  const groups = result.data.viewer.zones[0].httpRequests1dGroups;

  const pages = groups
    .filter(g => g.dimensions.requestPath)
    .map(g => ({
      path: g.dimensions.requestPath,
      pageviews: g.sum.pageViews || 0
    }));

  return jsonResponse({ pages });
}

/**
 * 查询 Cloudflare GraphQL API
 */
async function queryGraphQL(apiToken, query) {
  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    throw new Error(`GraphQL API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * 返回 JSON 响应
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: CORS_HEADERS
  });
}
