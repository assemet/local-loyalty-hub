
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

serve(async (req) => {
  try {
    const { storeId, customerId, qrToken } = await req.json()

    if (!storeId || !customerId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Validate QR token if provided
    if (qrToken) {
      const { data: qrData } = await supabase
        .from('qr_tokens')
        .select('*')
        .eq('token', qrToken)
        .eq('type', 'store')
        .eq('store_id', storeId)
        .single()

      if (!qrData) {
        return new Response(JSON.stringify({ error: 'Invalid QR token' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    // Check if already a member
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('*')
      .eq('customer_id', customerId)
      .eq('store_id', storeId)
      .single()

    if (existingMembership) {
      return new Response(JSON.stringify({ 
        success: true, 
        alreadyMember: true,
        membership: existingMembership 
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create membership (welcome bonus handled by trigger)
    const { data: membership, error } = await supabase
      .from('memberships')
      .insert({
        customer_id: customerId,
        store_id: storeId
      })
      .select('*, store:stores(*)')
      .single()

    if (error) throw error

    // Get welcome bonus details
    const { data: program } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('store_id', storeId)
      .single()

    // Send welcome notification
    const welcomeMsg = program?.mode === 'points' 
      ? `Welcome! You received ${program.welcome_points || 0} bonus points!`
      : `Welcome! You received ${program.welcome_stamps || 0} bonus stamps!`

    await supabase.from('notifications').insert({
      customer_id: customerId,
      type: 'telegram',
      title: `🎉 Welcome to ${membership.store.name}!`,
      message: welcomeMsg
    })

    return new Response(JSON.stringify({
      success: true,
      alreadyMember: false,
      membership
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