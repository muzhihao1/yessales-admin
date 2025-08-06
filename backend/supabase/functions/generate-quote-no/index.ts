import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 生成格式：YYYYMMDD-XXX
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    
    // 查询今日已有的最大编号
    const { data, error } = await supabaseClient
      .from('quotes')
      .select('quote_no')
      .like('quote_no', `${today}-%`)
      .order('quote_no', { ascending: false })
      .limit(1)

    if (error) {
      throw error
    }

    let sequence = 1
    if (data && data.length > 0) {
      const lastNo = data[0].quote_no
      const lastSequence = lastNo.split('-')[1]
      sequence = parseInt(lastSequence) + 1
    }

    const quoteNo = `${today}-${sequence.toString().padStart(3, '0')}`

    return new Response(
      JSON.stringify({ 
        success: true,
        data: { quote_no: quoteNo }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
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