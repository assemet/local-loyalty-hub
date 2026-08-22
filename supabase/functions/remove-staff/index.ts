
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

serve(async (req) => {
  try {
    const { staffId, storeId, ownerId } = await req.json()

    if (!staffId || !storeId || !ownerId) {
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

    // Remove staff (soft delete)
    const { data: updated } = await supabase
      .from('store_staff')
      .update({
        is_active: false,
        invite_status: 'removed',
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId)
      .eq('store_id', storeId)
      .select()
      .single()

    // Notify removed staff
    if (updated) {
      await supabase.from('notifications').insert({
        customer_id: updated.profile_id,
        type: 'staff_removed',
        title: 'Access Removed',
        message: `Your access to ${store.name} has been removed.`,
        metadata: { store_id: storeId }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Staff removed'
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