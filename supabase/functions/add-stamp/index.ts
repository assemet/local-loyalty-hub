
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

serve(async (req) => {
  try {
    const { membershipId, merchantId } = await req.json()

    if (!membershipId || !merchantId) {
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
    const { data: membership } = await supabase
      .from('memberships')
      .select('*, store:stores(*)')
      .eq('id', membershipId)
      .single()

    if (!membership) {
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

    // Get loyalty program
    const { data: program } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('store_id', membership.store_id)
      .single()

    if (!program || program.mode !== 'stamps') {
      return new Response(JSON.stringify({ error: 'Invalid program mode' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Add stamp
    const { data: transaction } = await supabase
      .from('transactions')
      .insert({
        membership_id: membershipId,
        store_id: membership.store_id,
        customer_id: membership.customer_id,
        type: 'purchase_stamp',
        stamps_change: 1,
        description: 'Stamp added',
        metadata: { awarded_by: merchantId, role: userRole }
      })
      .select()
      .single()

    // Update membership
    const { data: updatedMembership } = await supabase
      .from('memberships')
      .update({
        stamps_balance: membership.stamps_balance + 1,
        total_stamps_earned: membership.total_stamps_earned + 1,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', membershipId)
      .select()
      .single()

    // Check rewards
    const { data: rewards } = await supabase
      .from('rewards')
      .select('*')
      .eq('store_id', membership.store_id)
      .eq('is_active', true)
      .lte('stamps_required', updatedMembership.stamps_balance)

    // Send notification
    await supabase.from('notifications').insert({
      customer_id: membership.customer_id,
      type: 'telegram',
      title: '☕ Stamp Added!',
      message: `You now have ${updatedMembership.stamps_balance}/${program.stamps_required} stamps at ${membership.store.name}!`
    })

    return new Response(JSON.stringify({
      success: true,
      newBalance: updatedMembership.stamps_balance,
      stampsRequired: program.stamps_required,
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