/**
 * Cloudflare Worker for Analytics API (简化版)
 *
 * 用法：
 * 1. 创建 Cloudflare Worker
 * 2. 在 Worker Settings > Variables 中添加环境变量：
 *    - CF_API_TOKEN: 你的 Cloudflare API Token
 *    - CF_ZONE_ID: 你的 Zone ID
 * 3. 部署 Worker
 * 4. 设置路由：l4l.org/api/analytics/*
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow GET
    if (request.method !== 'GET') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders
      });
    }

    const apiToken = env.CF_API_TOKEN;
    const zoneId = env.CF_ZONE_ID;

    if (!apiToken || !zoneId) {
      return new Response(JSON.stringify({
        error: 'Missing CF_API_TOKEN or CF_ZONE_ID environment variables'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    try {
      const path = url.pathname;
      let data;

      if (path.endsWith('/pageviews')) {
        data = await getPageviews(apiToken, zoneId);
      } else if (path.endsWith('/countries')) {
        data = await getCountries(apiToken, zoneId);
      } else if (path.endsWith('/referrers')) {
        data = await getReferrers(apiToken, zoneId);
      } else {
        data = {
          error: 'Unknown endpoint',
          availableEndpoints: [
            '/api/analytics/pageviews',
            '/api/analytics/countries',
            '/api/analytics/referrers'
          ]
        };
      }

      return new Response(JSON.stringify(data, null, 2), {
        headers: corsHeaders
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Failed to fetch analytics',
        message: error.message
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};

// 获取近30天的页面浏览趋势
async function getPageviews(apiToken, zoneId) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const query = `
    query {
      viewer {
        zones(filter: {zoneTag: "${zoneId}"}) {
          httpRequests1dGroups(
            limit: 30,
            filter: {
              date_geq: "${formatDate(thirtyDaysAgo)}",
              date_lt: "${formatDate(now)}"
            },
            orderBy: [date_ASC]
          ) {
            dimensions { date }
            sum {
              pageViews
              requests
            }
            uniq { uniques }
          }
        }
      }
    }
  `;

  const result = await queryGraphQL(apiToken, query);
  const groups = result.data.viewer.zones[0].httpRequests1dGroups;

  return {
    dates: groups.map(g => g.dimensions.date),
    pageviews: groups.map(g => g.sum.pageViews || 0),
    visitors: groups.map(g => g.uniq.uniques || 0)
  };
}

// 获取地域分布
async function getCountries(apiToken, zoneId) {
  const query = `
    query {
      viewer {
        zones(filter: {zoneTag: "${zoneId}"}) {
          httpRequests1dGroups(
            limit: 10,
            filter: {
              date_geq: "${formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))}"
            },
            orderBy: [sum_requests_DESC]
          ) {
            dimensions { clientCountryName }
            sum { requests }
          }
        }
      }
    }
  `;

  const result = await queryGraphQL(apiToken, query);
  const groups = result.data.viewer.zones[0].httpRequests1dGroups;

  return {
    countries: groups
      .filter(g => g.dimensions.clientCountryName)
      .map(g => ({
        name: g.dimensions.clientCountryName,
        value: g.sum.requests || 0
      }))
  };
}

// 获取来源渠道
async function getReferrers(apiToken, zoneId) {
  const query = `
    query {
      viewer {
        zones(filter: {zoneTag: "${zoneId}"}) {
          httpRequests1dGroups(
            limit: 10,
            filter: {
              date_geq: "${formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))}"
            },
            orderBy: [sum_requests_DESC]
          ) {
            dimensions { refererHost }
            sum { requests }
          }
        }
      }
    }
  `;

  const result = await queryGraphQL(apiToken, query);
  const groups = result.data.viewer.zones[0].httpRequests1dGroups;

  return {
    referrers: groups
      .map(g => ({
        name: g.dimensions.refererHost || '直接访问',
        value: g.sum.requests || 0
      }))
  };
}

// 查询 GraphQL API
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
    throw new Error(`API error: ${response.status}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result;
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}
