import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface AlertRule {
  id: string
  rule_name: string
  rule_type: string
  metric_source: string
  metric_name: string
  condition: string
  threshold: number
  severity: string
  notification_channels: string[]
}

interface Metric {
  metric_value: number
  recorded_at: string
}

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

    // 获取所有激活的告警规则
    const { data: alertRules, error: rulesError } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('is_active', true)

    if (rulesError) {
      throw new Error(`Failed to fetch alert rules: ${rulesError.message}`)
    }

    const triggeredAlerts = []

    // 检查每个告警规则
    for (const rule of alertRules as AlertRule[]) {
      // 根据指标来源获取最新指标值
      const tableName = rule.metric_source === 'system' ? 'system_metrics' : 'business_metrics'
      
      const { data: metrics, error: metricsError } = await supabase
        .from(tableName)
        .select('metric_value, recorded_at')
        .eq('metric_name', rule.metric_name)
        .order('recorded_at', { ascending: false })
        .limit(1)

      if (metricsError) {
        console.error(`Error fetching metrics for ${rule.rule_name}:`, metricsError)
        continue
      }

      if (!metrics || metrics.length === 0) {
        continue
      }

      const currentValue = metrics[0].metric_value

      // 检查是否满足告警条件
      let shouldTrigger = false
      switch (rule.condition) {
        case '>':
          shouldTrigger = currentValue > rule.threshold
          break
        case '<':
          shouldTrigger = currentValue < rule.threshold
          break
        case '>=':
          shouldTrigger = currentValue >= rule.threshold
          break
        case '<=':
          shouldTrigger = currentValue <= rule.threshold
          break
        case '=':
          shouldTrigger = currentValue === rule.threshold
          break
        case '!=':
          shouldTrigger = currentValue !== rule.threshold
          break
      }

      if (shouldTrigger) {
        // 检查是否已经有未解决的告警
        const { data: existingAlert } = await supabase
          .from('alert_history')
          .select('id')
          .eq('rule_id', rule.id)
          .eq('alert_status', 'triggered')
          .order('triggered_at', { ascending: false })
          .limit(1)

        if (!existingAlert || existingAlert.length === 0) {
          // 创建新的告警记录
          const alertMessage = `${rule.rule_name}: ${rule.metric_name} 当前值 ${currentValue} ${rule.condition} 阈值 ${rule.threshold}`
          
          const { data: newAlert, error: alertError } = await supabase
            .from('alert_history')
            .insert({
              rule_id: rule.id,
              alert_status: 'triggered',
              metric_value: currentValue,
              threshold_value: rule.threshold,
              message: alertMessage
            })
            .select()

          if (!alertError && newAlert) {
            triggeredAlerts.push({
              alert: newAlert[0],
              rule: rule,
              message: alertMessage
            })

            // 发送通知
            await sendNotifications(rule, alertMessage)
          }
        }
      } else {
        // 检查是否有需要自动解决的告警
        const { data: alertsToResolve } = await supabase
          .from('alert_history')
          .select('id')
          .eq('rule_id', rule.id)
          .eq('alert_status', 'triggered')

        if (alertsToResolve && alertsToResolve.length > 0) {
          // 标记告警为已解决
          await supabase
            .from('alert_history')
            .update({
              alert_status: 'resolved',
              resolved_at: new Date().toISOString()
            })
            .in('id', alertsToResolve.map(a => a.id))
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        checkedRules: alertRules?.length || 0,
        triggeredAlerts: triggeredAlerts.length,
        alerts: triggeredAlerts
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error checking alerts:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function sendNotifications(rule: AlertRule, message: string) {
  for (const channel of rule.notification_channels) {
    try {
      switch (channel) {
        case 'dingtalk':
          await sendDingTalkNotification(rule, message)
          break
        case 'email':
          await sendEmailNotification(rule, message)
          break
        default:
          console.log(`Unknown notification channel: ${channel}`)
      }
    } catch (error) {
      console.error(`Failed to send ${channel} notification:`, error)
    }
  }
}

async function sendDingTalkNotification(rule: AlertRule, message: string) {
  const webhookUrl = Deno.env.get('DINGTALK_WEBHOOK_URL')
  if (!webhookUrl) {
    console.error('DingTalk webhook URL not configured')
    return
  }

  const severityEmoji = {
    critical: '🚨',
    warning: '⚠️',
    info: 'ℹ️'
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      msgtype: 'text',
      text: {
        content: `${severityEmoji[rule.severity]} YesSales 监控告警\n\n${message}\n\n时间: ${new Date().toLocaleString('zh-CN')}`
      }
    })
  })

  if (!response.ok) {
    throw new Error(`DingTalk notification failed: ${response.statusText}`)
  }
}

async function sendEmailNotification(rule: AlertRule, message: string) {
  // 这里需要集成邮件服务，如 SendGrid 或其他
  console.log('Email notification not implemented yet')
  
  // 示例代码：
  // const apiKey = Deno.env.get('SENDGRID_API_KEY')
  // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${apiKey}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     personalizations: [{
  //       to: [{ email: 'admin@yessales.com' }]
  //     }],
  //     from: { email: 'alerts@yessales.com' },
  //     subject: `[${rule.severity.toUpperCase()}] ${rule.rule_name}`,
  //     content: [{
  //       type: 'text/plain',
  //       value: message
  //     }]
  //   })
  // })
}