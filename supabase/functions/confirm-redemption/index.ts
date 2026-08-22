
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

serve(async (req) => {
  try {
    const { redemptionId, merchantId } = await req.json()

    if (!redemptionId || !merchantId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get redemption
    const { data: redemption } = await supabase
      .from('redemptions')
      .select('*, store:stores(*)')
      .eq('id', redemptionId)
      .single()

    if (!redemption) {
      return new Response(JSON.stringify({ error: 'Redemption not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Verify merchant/staff access
    const { data: store } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', redemption.store_id)
      .single()

    let isAuthorized = false

    if (store?.owner_id === merchantId) {
      isAuthorized = true
    } else {
      const { data: staff } = await supabase
        .from('store_staff')
        .select('role')
        .eq('store_id', redemption.store_id)
        .eq('profile_id', merchantId)
        .eq('invite_status', 'accepted')
        .eq('is_active', true)
        .single()

      if (staff) isAuthorized = true
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (redemption.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Already processed' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Update redemption
    const { data: updated } = await supabase
      .from('redemptions')
      .update({
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
        redeemed_by: merchantId
      })
      .eq('id', redemptionId)
      .select()
      .single()

    // Mark QR token as used
    await supabase.from('qr_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('redemption_id', redemptionId)

    // Send notification
    await supabase.from('notifications').insert({
      customer_id: redemption.customer_id,
      type: 'telegram',
      title: '✅ Reward Redeemed!',
      message: 'Your reward has been successfully redeemed!'
    })

    return new Response(JSON.stringify({
      success: true,
      redemption: updated
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})