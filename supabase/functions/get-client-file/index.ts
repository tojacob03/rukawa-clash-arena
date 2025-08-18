import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-token',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { sessionToken, filePath, bucket = 'analysis-files' } = await req.json()

    if (!sessionToken || !filePath) {
      return new Response(
        JSON.stringify({ error: 'Missing sessionToken or filePath' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate session and get client info
    const { data: sessionData, error: sessionError } = await supabase
      .rpc('validate_client_session', { session_token_param: sessionToken })

    if (sessionError || !sessionData || sessionData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const clientData = sessionData[0]
    
    // Verify file access permissions
    let hasAccess = false
    
    if (bucket === 'analysis-files') {
      // Check if client has access to this analysis file
      const { data: fileAccess, error: accessError } = await supabase
        .from('analysis_files')
        .select(`
          id,
          opponents!inner (
            client_id
          )
        `)
        .eq('file_path', filePath)
        .eq('opponents.client_id', clientData.client_id)
        .single()
      
      if (!accessError && fileAccess) {
        hasAccess = true
      }
    } else if (bucket === 'deck-files') {
      // Check if client has access to this deck file
      const { data: fileAccess, error: accessError } = await supabase
        .from('deck_files')
        .select(`
          id,
          deck_sets!inner (
            client_id
          )
        `)
        .eq('deck_link', filePath)
        .eq('deck_sets.client_id', clientData.client_id)
        .single()
      
      if (!accessError && fileAccess) {
        hasAccess = true
      }
    }

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Access denied to this file' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create signed URL for the file
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (urlError) {
      console.error('Error creating signed URL:', urlError)
      return new Response(
        JSON.stringify({ error: 'Failed to create file access URL' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        signedUrl: signedUrlData.signedUrl,
        expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})