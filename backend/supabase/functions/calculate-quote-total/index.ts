import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QuoteItem {
  unit_price: number
  quantity: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { items } = await req.json() as { items: QuoteItem[] }

    if (!items || !Array.isArray(items)) {
      throw new Error('Invalid request: items array is required')
    }

    // 计算总价
    const total = items.reduce((sum, item) => {
      if (typeof item.unit_price !== 'number' || typeof item.quantity !== 'number') {
        throw new Error('Invalid item: unit_price and quantity must be numbers')
      }
      return sum + (item.unit_price * item.quantity)
    }, 0)

    // 保留两位小数
    const roundedTotal = Math.round(total * 100) / 100

    return new Response(
      JSON.stringify({ 
        success: true,
        data: { 
          total_price: roundedTotal,
          item_count: items.length
        }
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
          code: 'INVALID_INPUT',
          message: error.message
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 400 
      }
    )
  }
})