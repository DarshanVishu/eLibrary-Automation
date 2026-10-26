import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const _corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: _corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        headers: { ..._corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // First delete from profiles (in case auth trigger doesn't cascade properly)
    const { error: profileError } = await supabaseClient.from('profiles').delete().eq('id', userId);

    if (profileError) {
      return new Response(
        JSON.stringify({ error: `Profile deletion failed: ${profileError.message}` }),
        {
          headers: { ..._corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }

    // Delete from auth.users
    const { error: authError } = await supabaseClient.auth.admin.deleteUser(userId);

    if (authError) {
      return new Response(JSON.stringify({ error: `Auth deletion failed: ${authError.message}` }), {
        headers: { ..._corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ..._corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ..._corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
