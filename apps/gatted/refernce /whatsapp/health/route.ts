/**
 * WhatsApp Health Check API
 * 
 * Returns connection status and template statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const NEXTEL_API_KEY = process.env.NEXTEL_API_KEY;
        const NEXTEL_ENDPOINT = process.env.NEXTEL_ENDPOINT || 'https://api.nextel.io/API_V2/Whatsapp/send_template/MFZPSnRHL3BiOHNsdnZMMTYwK0xrUT09';

        // Check if API key is configured
        const isConfigured = !!NEXTEL_API_KEY;

        // Get template statistics from database
        let templatesApproved = 0;
        let templatesPending = 0;
        let templatesRejected = 0;
        let templatesTotal = 0;
        let lastSync: Date | null = null;

        try {
            const { data: templates, error } = await supabase
                .from('whatsapp_templates')
                .select('*');

            if (!error && templates) {
                templatesTotal = templates.length;
                templatesApproved = templates.filter(t => t.status === 'approved' && t.is_active).length;
                templatesPending = templates.filter(t => t.status === 'pending').length;
                templatesRejected = templates.filter(t => t.status === 'rejected').length;

                // Get most recent sync timestamp
                const recentSync = templates
                    .filter(t => t.last_synced_at)
                    .sort((a, b) => {
                        const dateA = a.last_synced_at ? new Date(a.last_synced_at).getTime() : 0;
                        const dateB = b.last_synced_at ? new Date(b.last_synced_at).getTime() : 0;
                        return dateB - dateA;
                    })[0];

                if (recentSync?.last_synced_at) {
                    lastSync = new Date(recentSync.last_synced_at);
                }
            }
        } catch (dbError) {
            console.error('[Health Check] Database query failed:', dbError);
        }

        // Test connection to Nextel API (optional - can be slow)
        const searchParams = request.nextUrl.searchParams;
        const testConnection = searchParams.get('test') === 'true';

        let connectionStatus: 'connected' | 'disconnected' | 'unknown' = 'unknown';
        let apiResponse: any = null;

        if (testConnection && isConfigured) {
            try {
                // Simple ping to check if endpoint is reachable
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

                const response = await fetch(NEXTEL_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${NEXTEL_API_KEY}`,
                    },
                    body: JSON.stringify({
                        type: 'buttonTemplate',
                        templateId: 'vehicle_checkin', // Use a real approved template
                        templateLanguage: 'en',
                        sender_phone: '919999999999', // Dummy phone for test
                        templateArgs: ['Test User', 'TEST123', '12:00 PM', 'Test Venue'],
                    }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                apiResponse = await response.json();
                connectionStatus = response.ok ? 'connected' : 'disconnected';
            } catch (error) {
                console.error('[Health Check] Connection test failed:', error);
                connectionStatus = 'disconnected';
            }
        }

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            whatsapp: {
                configured: isConfigured,
                endpoint: NEXTEL_ENDPOINT,
                connectionStatus,
                ...(apiResponse && { testResponse: apiResponse }),
            },
            templates: {
                total: templatesTotal,
                approved: templatesApproved,
                pending: templatesPending,
                rejected: templatesRejected,
                lastSync: lastSync?.toISOString() || null,
            },
            requiredTemplates: [
                'wallet_created',
                'signup_bonus',
                'topup_confirmation',
                'redeem_bill',
                'redeem_item',
                'session_checkin',
            ],
        });

    } catch (error) {
        console.error('[Health Check] Error:', error);
        return NextResponse.json(
            {
                status: 'error',
                error: 'Failed to check health',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
