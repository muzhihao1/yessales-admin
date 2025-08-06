import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.19.3/package/xlsx.mjs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 验证用户权限
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 获取请求参数
    const { startDate, endDate, status } = await req.json()

    // 构建查询
    let query = supabaseClient
      .from('quotes')
      .select(`
        *,
        customer:customers(*),
        sales:users(*),
        items:quote_items(*)
      `)

    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: quotes, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // 转换为Excel格式
    const excelData = quotes.map(quote => ({
      '报价单号': quote.quote_no,
      '客户名称': quote.customer?.name || '',
      '客户电话': quote.customer?.phone || '',
      '销售人员': quote.sales?.name || '系统',
      '产品明细': quote.items?.map(item => 
        `${item.name} x ${item.quantity} = ¥${item.total_price}`
      ).join('\n'),
      '总金额': `¥${quote.total_price}`,
      '状态': {
        'pending': '待确认',
        'approved': '已确认',
        'rejected': '已拒绝',
        'completed': '已完成'
      }[quote.status] || quote.status,
      '备注': quote.remark || '',
      '创建时间': new Date(quote.created_at).toLocaleString('zh-CN'),
      '更新时间': new Date(quote.updated_at).toLocaleString('zh-CN')
    }))

    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    
    // 设置列宽
    const colWidths = [
      { wch: 15 }, // 报价单号
      { wch: 20 }, // 客户名称
      { wch: 15 }, // 客户电话
      { wch: 15 }, // 销售人员
      { wch: 50 }, // 产品明细
      { wch: 15 }, // 总金额
      { wch: 10 }, // 状态
      { wch: 30 }, // 备注
      { wch: 20 }, // 创建时间
      { wch: 20 }  // 更新时间
    ]
    worksheet['!cols'] = colWidths

    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '报价单列表')
    
    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    // 生成文件名
    const fileName = `报价单导出_${new Date().toISOString().slice(0, 10)}.xlsx`

    return new Response(excelBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error.message
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 500 
      }
    )
  }
})