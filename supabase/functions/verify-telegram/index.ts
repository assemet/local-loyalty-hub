import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const TELEGRAM_BOT_TOKEN = Deno.env.get('BOT_TOKEN')
const SUPABASE_URL = Deno.env.get('PROJECT_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    const { initData } = await req.json()
    
    if (!initData) {
      return new Response(JSON.stringify({ error: 'Missing initData' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse initData
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')
    urlParams.delete('hash')
    
    // Sort params alphabetically
    const params = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    
    // Create secret key from bot token
    const encoder = new TextEncoder()
    const secretKey = await crypto.subtle.digest('SHA-256', encoder.encode(TELEGRAM_BOT_TOKEN))
    
    // Calculate HMAC-SHA-256
    const key = await crypto.subtle.importKey(
      'raw', secretKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(params))
    const calculatedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    if (calculatedHash !== hash) {
      return new Response(JSON.stringify({ error: 'Invalid hash' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse user data
    const userData = JSON.parse(urlParams.get('user') || '{}')
    
    // Connect to Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Check if profile exists
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', userData.id)
      .single()

    if (!profile) {
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          telegram_id: userData.id,
          telegram_username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          photo_url: userData.photo_url,
          language_code: userData.language_code || 'en'
        })
        .select()
        .single()
      
      if (createError) throw createError
      profile = newProfile
    } else {
      // Update profile with latest Telegram data
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .update({
          telegram_username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          photo_url: userData.photo_url,
          language_code: userData.language_code || profile.language_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single()
      
      profile = updatedProfile
    }

    // Check if user is a merchant
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', profile.id)
      .single()

    return new Response(JSON.stringify({
      success: true,
      profile,
      isMerchant: !!store,
      storeId: store?.id || null
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