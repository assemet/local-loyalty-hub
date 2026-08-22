
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

serve(async (req) => {
  try {
    const { storeId, ownerId, telegramUsername } = await req.json()

    if (!storeId || !ownerId || !telegramUsername) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify owner
    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .eq('owner_id', ownerId)
      .single()

    if (!store) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Find staff profile by Telegram username
    const cleanUsername = telegramUsername.replace('@', '').trim().toLowerCase()

    const { data: staffProfile } = await supabase
      .from('profiles')
      .select('*')
      .ilike('telegram_username', cleanUsername)
      .single()

    if (!staffProfile) {
      return new Response(JSON.stringify({ 
        error: 'User not found. Make sure they have used Fello at least once.' 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Cannot invite owner
    if (staffProfile.id === ownerId) {
      return new Response(JSON.stringify({ error: 'Cannot invite yourself' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if already invited
    const { data: existing } = await supabase
      .from('store_staff')
      .select('*')
      .eq('store_id', storeId)
      .eq('profile_id', staffProfile.id)
      .single()

    if (existing) {
      if (existing.invite_status === 'accepted' && existing.is_active) {
        return new Response(JSON.stringify({ error: 'Already a staff member' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      if (existing.invite_status === 'pending') {
        return new Response(JSON.stringify({ error: 'Invitation already pending' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      // If rejected/removed before, update to pending
      const { data: updated } = await supabase
        .from('store_staff')
        .update({
          invite_status: 'pending',
          is_active: true,
          invited_at: new Date().toISOString(),
          responded_at: null
        })
        .eq('id', existing.id)
        .select()
        .single()

      return new Response(JSON.stringify({
        success: true,
        message: 'Invitation re-sent',
        invite: updated
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create invitation
    const { data: invite, error } = await supabase
      .from('store_staff')
      .insert({
        store_id: storeId,
        profile_id: staffProfile.id,
        role: 'cashier',
        invite_status: 'pending',
        invited_by: ownerId
      })
      .select()
      .single()

    if (error) throw error

    // Create notification for staff
    await supabase.from('notifications').insert({
      customer_id: staffProfile.id,
      type: 'staff_invite',
      title: 'New Job Invitation',
      message: `You have been invited to join ${store.name} as a cashier.`,
      metadata: { store_id: storeId, invite_id: invite.id }
    })

    return new Response(JSON.stringify({
      success: true,
      message: 'Invitation sent',
      invite
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