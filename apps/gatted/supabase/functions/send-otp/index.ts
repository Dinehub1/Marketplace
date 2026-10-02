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
        console.log('=== SEND-OTP FUNCTION STARTED ===')

        // Parse request body
        let body: { phone?: string } = {}
        try {
            body = await req.json()
            console.log('Request body received:', { phone: body.phone })
        } catch (e) {
            console.error('Invalid JSON body:', e)
            return new Response(
                JSON.stringify({ error: 'Invalid JSON body' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const { phone: rawPhone } = body

        if (!rawPhone) {
            console.error('Phone number missing in request')
            return new Response(
                JSON.stringify({ error: 'Phone number is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Sanitize phone: remove ALL non-digit characters (spaces, +, hyphens, etc)
        // This ensures compatibility with Nextel API
        const phone = rawPhone.replace(/\D/g, '')
        console.log('Phone sanitized:', { raw: rawPhone, sanitized: phone })

        // Validate Indian mobile number
        // Must be: 917566636666 (12 digits starting with 91) OR 7566636666 (10 digits starting with 6-9)
        const isValid12Digit = /^91[6-9]\d{9}$/.test(phone)
        const isValid10Digit = /^[6-9]\d{9}$/.test(phone)

        if (!isValid12Digit && !isValid10Digit) {
            console.error('Invalid phone format:', phone)
            return new Response(
                JSON.stringify({
                    error: 'Invalid Indian mobile number. Use formats: +91XXXXXXXXXX, 91XXXXXXXXXX, or 10-digit number starting with 6-9'
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Ensure phone has 91 prefix for API calls
        const phoneWith91 = phone.startsWith('91') ? phone : `91${phone}`
        // Database format with + prefix
        const dbPhone = `+${phoneWith91}`

        console.log('Phone formats:', {
            forNextelAPI: phoneWith91,
            forDatabase: dbPhone
        })

        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase environment variables missing')
            return new Response(
                JSON.stringify({ error: 'Server configuration error' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseKey)
        console.log('Supabase client initialized')

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        console.log('OTP generated:', { otp, expiresAt: expiresAt.toISOString() })

        // Save OTP to database
        const { error: dbError } = await supabase
            .from('auth_otps')
            .upsert({
                phone: dbPhone,
                otp_code: otp,
                verified: false,
                created_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString()
            }, { onConflict: 'phone' })

        if (dbError) {
            console.error('Database error:', dbError)
            return new Response(
                JSON.stringify({ error: 'Failed to generate OTP', details: dbError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('OTP saved to database successfully')

        // Send via Nextel WhatsApp API
        const nextelEndpoint = Deno.env.get('NEXTEL_ENDPOINT')

        console.log('Nextel config check:', {
            hasEndpoint: !!nextelEndpoint,
            endpoint: nextelEndpoint ? nextelEndpoint.substring(0, 50) + '...' : 'MISSING'
        })

        let whatsappSuccess = false
        let whatsappError = null

        if (!nextelEndpoint) {
            console.error('Nextel configuration missing:', {
                endpoint: !!nextelEndpoint
            })
            whatsappError = 'WhatsApp API not configured on server'
        } else {
            try {
                // Build request body exactly as per working Nextel implementation
                // Reference: /refernce /whatsapp/health/route.ts (lines 72-78)
                const nextelRequestBody = {
                    type: "buttonTemplate",
                    templateId: "auth",
                    templateLanguage: "en",  // CRITICAL: Must be 'templateLanguage', not 'language'!
                    sender_phone: phoneWith91,  // Format: 917566636666 (no + prefix)
                    templateArgs: [otp]
                }

                console.log('=== NEXTEL API REQUEST ===')
                console.log('Endpoint:', nextelEndpoint)
                console.log('Request body:', JSON.stringify(nextelRequestBody, null, 2))

                const nextelResponse = await fetch(nextelEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(nextelRequestBody)
                })

                const nextelResponseText = await nextelResponse.text()

                console.log('=== NEXTEL API RESPONSE ===')
                console.log('Status:', nextelResponse.status)
                console.log('Status Text:', nextelResponse.statusText)
                console.log('Response body:', nextelResponseText)

                // Try to parse response as JSON
                let nextelData
                try {
                    nextelData = JSON.parse(nextelResponseText)
                    console.log('Parsed response:', JSON.stringify(nextelData, null, 2))
                } catch (e) {
                    console.log('Response is not JSON:', nextelResponseText)
                    nextelData = { statusText: nextelResponseText }
                }

                // Check for success
                // Nextel API returns status 200 with status: "success" or similar
                if (nextelResponse.ok) {
                    if (nextelData.status === 'success' || nextelData.status === '200' || nextelData.status === 200) {
                        whatsappSuccess = true
                        console.log('✅ WhatsApp OTP sent successfully!')
                    } else {
                        whatsappError = JSON.stringify(nextelData)
                        console.error('❌ Nextel returned OK but with error:', nextelData)
                    }
                } else {
                    whatsappError = JSON.stringify(nextelData)
                    console.error('❌ Nextel API returned error:', {
                        status: nextelResponse.status,
                        data: nextelData
                    })
                }

            } catch (nextelError) {
                whatsappError = String(nextelError)
                console.error('❌ Nextel fetch error:', nextelError)
            }
        }

        // Build response
        const responseData: any = {
            success: true,
            message: whatsappSuccess ? 'OTP sent via WhatsApp' : 'OTP generated (WhatsApp delivery failed)',
            expires_in: 600
        }

        // SECURITY: Only expose OTP in development environments
        const isDevMode = Deno.env.get('ENVIRONMENT') === 'development'
        if (!whatsappSuccess && isDevMode) {
            responseData.dev_otp = otp
            responseData.whatsapp_error = whatsappError
            console.log('⚠️ DEV MODE: Returning OTP in response:', otp)
        }

        console.log('=== SEND-OTP FUNCTION COMPLETED ===')
        console.log('Final response:', responseData)

        return new Response(
            JSON.stringify(responseData),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('=== UNCAUGHT ERROR ===')
        console.error('Error:', error)
        console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace')

        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                details: String(error)
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
