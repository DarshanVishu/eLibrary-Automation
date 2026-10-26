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
    const defaultRole = 'student';
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { users } = await req.json();

    if (!Array.isArray(users)) {
      return new Response(JSON.stringify({ error: 'users must be an array' }), {
        headers: { ..._corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const results = [];

    for (const user of users) {
      if (!user.email) {
        results.push({ email: user.email, success: false, error: 'Email required' });
        continue;
      }

      const fullName = user.name || user.full_name || user.email.split('@')[0];
      const role = user.role || defaultRole;
      let grade = null;
      if (user.grade) {
        grade = parseInt(user.grade, 10);
      }

      if (!user.password) {
        // Generate a password based on name, grade, and role
        const firstName = fullName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
        const gradeStr = grade !== null ? grade.toString() : '';
        user.password = `${firstName}@${role}${gradeStr}`;

        // Ensure minimum 6 characters for Supabase auth
        if (user.password.length < 6) {
          user.password += '123';
        }
      }

      const { data, error } = await supabaseClient.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: role,
          grade: grade,
        },
      });

      if (error) {
        results.push({ email: user.email, success: false, error: error.message });
      } else {
        results.push({ email: user.email, success: true, id: data.user.id });
      }
    }

    return new Response(JSON.stringify({ results }), {
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
