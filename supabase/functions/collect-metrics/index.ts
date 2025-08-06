import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    })

    // 收集系统指标
    const systemMetrics = []
    
    // 1. 数据库统计
    const { data: dbStats } = await supabase.rpc('get_database_stats')
    if (dbStats) {
      systemMetrics.push({
        metric_type: 'database',
        metric_name: 'table_size',
        metric_value: dbStats.total_size || 0,
        metric_unit: 'bytes'
      })
    }

    // 2. 连接数统计
    const { data: connections } = await supabase.rpc('get_connection_count')
    if (connections) {
      systemMetrics.push({
        metric_type: 'database',
        metric_name: 'db_connections',
        metric_value: connections.count || 0,
        metric_unit: 'count'
      })
    }

    // 3. API 错误率（从日志表统计）
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: errorLogs, error: errorLogsError } = await supabase
      .from('api_logs')
      .select('status_code')
      .gte('created_at', oneHourAgo)

    if (errorLogs) {
      const totalRequests = errorLogs.length
      const errorRequests = errorLogs.filter(log => log.status_code >= 400).length
      const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0

      systemMetrics.push({
        metric_type: 'api',
        metric_name: 'error_rate',
        metric_value: errorRate,
        metric_unit: 'percent'
      })
    }

    // 4. 存储使用情况
    const { data: storageData } = await supabase.storage.listBuckets()
    if (storageData) {
      // 这里需要实际的存储使用统计 API
      systemMetrics.push({
        metric_type: 'storage',
        metric_name: 'bucket_count',
        metric_value: storageData.length,
        metric_unit: 'count'
      })
    }

    // 收集业务指标
    const businessMetrics = []

    // 1. 今日报价单数量
    const today = new Date().toISOString().split('T')[0]
    const { count: quotesCount } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)

    businessMetrics.push({
      metric_type: 'sales',
      metric_name: 'daily_quotes',
      metric_value: quotesCount || 0,
      dimensions: { date: today }
    })

    // 2. 活跃用户数
    const { count: activeUsers } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true })
      .gte('last_sign_in_at', oneHourAgo)

    businessMetrics.push({
      metric_type: 'users',
      metric_name: 'active_users_hourly',
      metric_value: activeUsers || 0,
      dimensions: { period: '1h' }
    })

    // 3. 产品统计
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    businessMetrics.push({
      metric_type: 'inventory',
      metric_name: 'active_products',
      metric_value: productsCount || 0
    })

    // 保存系统指标
    if (systemMetrics.length > 0) {
      const { error: sysError } = await supabase
        .from('system_metrics')
        .insert(systemMetrics)

      if (sysError) {
        console.error('Error saving system metrics:', sysError)
      }
    }

    // 保存业务指标
    if (businessMetrics.length > 0) {
      const { error: bizError } = await supabase
        .from('business_metrics')
        .insert(businessMetrics)

      if (bizError) {
        console.error('Error saving business metrics:', bizError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        metrics: {
          system: systemMetrics.length,
          business: businessMetrics.length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error collecting metrics:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})