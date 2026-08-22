
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

serve(async (req) => {
  try {
    const { token, merchantId } = await req.json()

    if (!token || !merchantId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get QR token
    const { data: qrToken } = await supabase
      .from('qr_tokens')
      .select('*, store:stores(*)')
      .eq('token', token)
      .single()

    if (!qrToken) {
      return new Response(JSON.stringify({ error: 'Invalid QR code' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Verify merchant/staff access to store
    const { data: store } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', qrToken.store_id)
      .single()

    let isAuthorized = false

    if (store?.owner_id === merchantId) {
      isAuthorized = true
    } else {
      const { data: staff } = await supabase
        .from('store_staff')
        .select('role')
        .eq('store_id', qrToken.store_id)
        .eq('profile_id', merchantId)
        .eq('invite_status', 'accepted')
        .eq('is_active', true)
        .single()

      if (staff) isAuthorized = true
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized store' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check expiry
    if (qrToken.expires_at && new Date(qrToken.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'QR code expired' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if already used
    if (qrToken.used_at) {
      return new Response(JSON.stringify({ error: 'QR code already used' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Handle based on type
    if (qrToken.type === 'customer') {
      const { data: membership } = await supabase
        .from('memberships')
        .select('*, customer:profiles(*), store:stores(*)')
        .eq('id', qrToken.membership_id)
        .single()

      return new Response(JSON.stringify({
        success: true,
        type: 'customer',
        membership
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (qrToken.type === 'reward') {
      const { data: redemption } = await supabase
        .from('redemptions')
        .select('*, reward:rewards(*), customer:profiles(*), membership:memberships(*)')
        .eq('id', qrToken.redemption_id)
        .single()

      if (redemption.status === 'redeemed') {
        return new Response(JSON.stringify({ error: 'Reward already redeemed' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({
        success: true,
        type: 'reward',
        redemption
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown QR type' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})