import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface NotionWebhookPayload {
  object: string;
  event_type: string;
  data: {
    object: string;
    id: string;
    properties: {
      Title: {
        title: Array<{ plain_text: string }>;
      };
      Slug: {
        rich_text: Array<{ plain_text: string }>;
      };
      "Image URL": {
        url: string;
      };
      Status: {
        select: { name: string };
      };
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '')
    const expectedKey = Deno.env.get('SYNC_API_KEY')
    
    if (!apiKey || apiKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload: NotionWebhookPayload = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (payload.event_type === 'page.updated' || payload.event_type === 'page.created') {
      const pageData = payload.data
      
      const title = pageData.properties.Title?.title?.[0]?.plain_text || ''
      const slug = pageData.properties.Slug?.rich_text?.[0]?.plain_text || ''
      const imageUrl = pageData.properties["Image URL"]?.url || ''
      const status = pageData.properties.Status?.select?.name || 'Draft'
      const isActive = status === 'Published'

      if (!title || !slug) {
        return new Response(
          JSON.stringify({ message: 'Skipped - missing required fields' }), 
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase
        .from('advice_items')
        .upsert({
          notion_id: pageData.id,
          title: title,
          slug: slug,
          image_url: imageUrl,
          is_active: isActive,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'notion_id'
        })

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Database update failed', details: error.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          message: 'Successfully processed webhook', 
          title: title,
          slug: slug,
          active: isActive
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Event type not handled' }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
