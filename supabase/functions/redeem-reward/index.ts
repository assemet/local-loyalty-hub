
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

serve(async (req) => {
  try {
    const { rewardId, membershipId, customerId } = await req.json()

    if (!rewardId || !membershipId || !customerId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get membership and reward
    const { data: membership } = await supabase
      .from('memberships')
      .select('*, store:stores(*)')
      .eq('id', membershipId)
      .eq('customer_id', customerId)
      .single()

    if (!membership) {
      return new Response(JSON.stringify({ error: 'Membership not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data: reward } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .eq('store_id', membership.store_id)
      .eq('is_active', true)
      .single()

    if (!reward) {
      return new Response(JSON.stringify({ error: 'Reward not found or inactive' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get loyalty program
    const { data: program } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('store_id', membership.store_id)
      .single()

    // Validate balance
    if (program.mode === 'points') {
      if (membership.points_balance < (reward.points_cost || 0)) {
        return new Response(JSON.stringify({ error: 'Insufficient points' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    } else {
      if (membership.stamps_balance < (reward.stamps_required || 0)) {
        return new Response(JSON.stringify({ error: 'Insufficient stamps' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    // Generate QR token for redemption
    const qrToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour expiry

    // Create redemption
    const { data: redemption, error: redemptionError } = await supabase
      .from('redemptions')
      .insert({
        membership_id: membershipId,
        reward_id: rewardId,
        store_id: membership.store_id,
        customer_id: customerId,
        qr_token: qrToken,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (redemptionError) throw redemptionError

    // Create QR token record
    await supabase.from('qr_tokens').insert({
      token: qrToken,
      type: 'reward',
      store_id: membership.store_id,
      customer_id: customerId,
      membership_id: membershipId,
      redemption_id: redemption.id,
      expires_at: expiresAt.toISOString()
    })

    // Deduct balance
    if (program.mode === 'points') {
      await supabase.from('transactions').insert({
        membership_id: membershipId,
        store_id: membership.store_id,
        customer_id: customerId,
        type: 'reward_redemption_points',
        points_change: -(reward.points_cost || 0),
        reward_id: rewardId,
        description: `Redeemed: ${reward.name}`
      })

      await supabase.from('memberships')
        .update({ points_balance: membership.points_balance - (reward.points_cost || 0) })
        .eq('id', membershipId)
    } else {
      await supabase.from('transactions').insert({
        membership_id: membershipId,
        store_id: membership.store_id,
        customer_id: customerId,
        type: 'reward_redemption_stamps',
        stamps_change: -(reward.stamps_required || 0),
        reward_id: rewardId,
        description: `Redeemed: ${reward.name}`
      })

      await supabase.from('memberships')
        .update({ stamps_balance: membership.stamps_balance - (reward.stamps_required || 0) })
        .eq('id', membershipId)
    }

    // Send notification
    await supabase.from('notifications').insert({
      customer_id: customerId,
      type: 'telegram',
      title: '🎁 Reward Unlocked!',
      message: `Show this QR to redeem your ${reward.name}!`
    })

    return new Response(JSON.stringify({
      success: true,
      redemption,
      qrToken
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