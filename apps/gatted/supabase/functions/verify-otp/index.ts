import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { phone, otp } = await req.json()

        // Validate inputs
        if (!phone || !otp) {
            return new Response(
                JSON.stringify({ error: 'Phone and OTP are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!/^\d{6}$/.test(otp)) {
            return new Response(
                JSON.stringify({ error: 'OTP must be 6 digits' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Initialize Supabase with service role
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Find valid OTP
        const { data: otpRecord, error: otpError } = await supabase
            .from('auth_otps')
            .select('*')
            .eq('phone', phone)
            .eq('otp_code', otp)
            .eq('verified', false)
            .gt('expires_at', new Date().toISOString())
            .single()

        if (otpError || !otpRecord) {
            return new Response(
                JSON.stringify({ error: 'Invalid or expired OTP' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Mark OTP as verified
        await supabase
            .from('auth_otps')
            .update({ verified: true })
            .eq('id', otpRecord.id)

        // Find or create user profile
        // Check if profile exists
        let { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone', phone)
            .single()

        if (!profile) {
            // Create new profile
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                    phone: phone,
                    full_name: 'New User', // Placeholder
                    is_active: true
                })
                .select()
                .single()

            if (createError) {
                console.error('Profile creation error:', createError)
                return new Response(
                    JSON.stringify({ error: 'Failed to create user profile' }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
            profile = newProfile
        }

        // Create session token
        const sessionToken = crypto.randomUUID() + '-' + crypto.randomUUID()
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

        const { error: sessionError } = await supabase
            .from('auth_sessions')
            .insert({
                user_id: profile.id,
                token: sessionToken,
                expires_at: expiresAt.toISOString(),
                device_info: {
                    user_agent: req.headers.get('user-agent'),
                    created_at: new Date().toISOString()
                }
            })

        if (sessionError) {
            console.error('Session creation error:', sessionError)
            return new Response(
                JSON.stringify({ error: 'Failed to create session' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Get user roles
        const { data: roles } = await supabase
            .from('user_roles')
            .select(`
                *,
                society:societies(id, name),
                unit:units(id, unit_number)
            `)
            .eq('user_id', profile.id)
            .eq('is_active', true)

        return new Response(
            JSON.stringify({
                success: true,
                user: profile,
                roles: roles || [],
                session_token: sessionToken,
                expires_at: expiresAt.toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
