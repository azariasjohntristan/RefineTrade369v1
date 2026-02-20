import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PlanLimits {
  free: { maxTrades: number; maxSubAccounts: number }
  pro: { maxTrades: number; maxSubAccounts: number }
}

const PLAN_LIMITS: PlanLimits = {
  free: { maxTrades: 100, maxSubAccounts: 1 },
  pro: { maxTrades: Infinity, maxSubAccounts: Infinity }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, action } = await req.json()

    if (!user_id || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user_id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const limits = PLAN_LIMITS[profile.plan as keyof PlanLimits]

    if (action === 'add_subaccount') {
      const { count } = await supabase
        .from('sub_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id)

      const allowed = (count ?? 0) < limits.maxSubAccounts
      return new Response(
        JSON.stringify({
          allowed,
          limit: limits.maxSubAccounts,
          current: count ?? 0,
          message: allowed ? null : `Sub-account limit reached (${limits.maxSubAccounts}). Upgrade to Pro for unlimited.`
        }),
        { status: allowed ? 200 : 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'add_trade') {
      const { count } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id)

      const allowed = (count ?? 0) < limits.maxTrades
      return new Response(
        JSON.stringify({
          allowed,
          limit: limits.maxTrades,
          current: count ?? 0,
          message: allowed ? null : `Trade limit reached (${limits.maxTrades}). Upgrade to Pro for unlimited.`
        }),
        { status: allowed ? 200 : 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
