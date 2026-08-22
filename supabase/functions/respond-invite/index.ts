
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

serve(async (req) => {
  try {
    const { inviteId, staffId, action } = await req.json()

    if (!inviteId || !staffId || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!['accepted', 'rejected'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify invite belongs to staff
    const { data: invite } = await supabase
      .from('store_staff')
      .select('*, store:stores(*)')
      .eq('id', inviteId)
      .eq('profile_id', staffId)
      .eq('invite_status', 'pending')
      .single()

    if (!invite) {
      return new Response(JSON.stringify({ error: 'Invite not found or already processed' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Update invite
    const { data: updated } = await supabase
      .from('store_staff')
      .update({
        invite_status: action,
        responded_at: new Date().toISOString(),
        is_active: action === 'accepted'
      })
      .eq('id', inviteId)
      .select()
      .single()

    // Notify owner
    await supabase.from('notifications').insert({
      customer_id: invite.store.owner_id,
      type: 'staff_response',
      title: action === 'accepted' ? 'Staff Joined!' : 'Invitation Declined',
      message: action === 'accepted' 
        ? `A new cashier has joined ${invite.store.name}.`
        : `A user declined to join ${invite.store.name}.`,
      metadata: { store_id: invite.store_id, staff_id: staffId }
    })

    return new Response(JSON.stringify({
      success: true,
      action,
      invite: updated
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