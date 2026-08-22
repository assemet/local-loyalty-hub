
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

serve(async (req) => {
  try {
    const { membershipId, purchaseAmount, merchantId } = await req.json()

    if (!membershipId || !purchaseAmount || !merchantId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get membership
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('*, store:stores(*)')
      .eq('id', membershipId)
      .single()

    if (membershipError || !membership) {
      return new Response(JSON.stringify({ error: 'Membership not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Verify merchant/staff access
    const { data: store } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', membership.store_id)
      .single()

    let isAuthorized = false
    let userRole = null

    if (store?.owner_id === merchantId) {
      isAuthorized = true
      userRole = 'owner'
    } else {
      const { data: staff } = await supabase
        .from('store_staff')
        .select('role')
        .eq('store_id', membership.store_id)
        .eq('profile_id', merchantId)
        .eq('invite_status', 'accepted')
        .eq('is_active', true)
        .single()

      if (staff) {
        isAuthorized = true
        userRole = staff.role
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get loyalty program rules
    const { data: program } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('store_id', membership.store_id)
      .single()

    if (!program || program.mode !== 'points') {
      return new Response(JSON.stringify({ error: 'Invalid loyalty program' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Calculate points (server-side only!)
    const pointsEarned = Math.floor(
      (purchaseAmount / program.currency_unit) * program.points_per_currency
    )

    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        membership_id: membershipId,
        store_id: membership.store_id,
        customer_id: membership.customer_id,
        type: 'purchase_points',
        amount: purchaseAmount,
        points_change: pointsEarned,
        description: `Purchase: ${purchaseAmount}`,
        metadata: { awarded_by: merchantId, role: userRole }
      })
      .select()
      .single()

    if (txError) throw txError

    // Update membership balance
    const { data: updatedMembership, error: updateError } = await supabase
      .from('memberships')
      .update({
        points_balance: membership.points_balance + pointsEarned,
        total_points_earned: membership.total_points_earned + pointsEarned,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', membershipId)
      .select()
      .single()

    if (updateError) throw updateError

    // Send notification
    await supabase.from('notifications').insert({
      customer_id: membership.customer_id,
      type: 'telegram',
      title: '⭐ Points Earned!',
      message: `You earned ${pointsEarned} points at ${membership.store.name}!`
    })

    return new Response(JSON.stringify({
      success: true,
      pointsEarned,
      newBalance: updatedMembership.points_balance,
      transaction
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