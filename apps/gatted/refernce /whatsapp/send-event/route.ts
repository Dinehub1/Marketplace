/**
 * Event-Based WhatsApp Send API
 * 
 * POST: Send WhatsApp message by event_key
 * - Validates event_key against whatsapp-eventContext
 * - Resolves template by event_key from database
 * - Builds args from payload using arg_mapping
 * - Sends via Nextel API
 * 
 * This is the ONLY endpoint frontend should use to send WhatsApp messages.
 * Frontend knows business intent (event_key), backend handles everything else.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import {
    resolveTemplateByEvent,
    buildTemplateArgs,
    buildPreviewMessage,
    type SendTemplatePayload
} from '@/lib/whatsapp/templateService';
import { sendNextelTemplate } from '@/lib/whatsapp/notifications';
import {
    isValidEventKey,
    type WhatsAppEventKey,
    WHATSAPP_EVENTS
} from '@/lib/whatsapp/whatsapp-eventContext';

// ============================================================================
// PAYLOAD TYPE DEFINITIONS (for reference and documentation)
// ============================================================================

/**
 * Expected payload keys for each event type.
 * These keys must match the arg_mapping.key values in the database.
 * 
 * Note: The actual required keys are determined by the database arg_mapping,
 * not by these TypeScript types. These serve as documentation.
 */
export interface EventPayloadTypes {
    // Wallet Lifecycle
    wallet_created: {
        phone: string;
        customer_name: string;
        partner_name: string;
        wallet_balance: number;
        customer_code?: string;
    };

    wallet_topup: {
        phone: string;
        customer_name: string;
        partner_name: string;
        action_type: string;  // "TOPUP", "REDEEM", "REFUND"
        wallet_balance: number;
        date_time: string;    // ISO date string
        topup_amount?: number;
        bonus_amount?: number;
    };

    wallet_expired: {
        phone: string;
        customer_name: string;
        partner_name: string;
        wallet_balance: number;
        expiry_date?: string;
    };

    wallet_expiry_reminder: {
        phone: string;
        customer_name: string;
        partner_name: string;
        wallet_balance: number;
        expiry_date: string;
        days_remaining?: number;
    };

    // Transactions
    item_redeemed: {
        phone: string;
        customer_name: string;
        partner_name: string;
        items_list: string;
        total_amount: number;
        wallet_balance: number;
    };

    bill_redeemed: {
        phone: string;
        customer_name: string;
        partner_name: string;
        bill_amount: number;
        wallet_balance: number;
        bill_reference?: string;
    };

    refund_transaction: {
        phone: string;
        customer_name: string;
        partner_name: string;
        refund_amount: number;
        wallet_balance: number;
        reference_id?: string;
    };

    refund_wallet: {
        phone: string;
        customer_name: string;
        partner_name: string;
        refund_amount: number;
        wallet_balance: number;
    };

    topup_request: {
        phone: string;
        customer_name: string;
        partner_name: string;
        current_balance: number;
        suggested_amount?: number;
    };

    // Packages
    package_created: {
        phone: string;
        customer_name: string;
        partner_name: string;
        package_name: string;
        package_items?: string;
        validity_days?: number;
    };

    package_item_redeemed: {
        phone: string;
        customer_name: string;
        partner_name: string;
        package_name: string;
        item_name: string;
        remaining_count?: number;
    };

    // Customer Lifecycle
    signup_bonus: {
        phone: string;
        customer_name: string;
        partner_name: string;
        bonus_amount: number;
        wallet_balance: number;
    };

    vehicle_checkin: {
        phone: string;
        customer_name: string;
        partner_name: string;
        vehicle_number: string;
        checkin_time: string;
    };

    // Authentication
    otp_auth: {
        phone: string;
        otp_code: string;
    };
}

// ============================================================================
// REQUEST INTERFACE
// ============================================================================

interface SendRequest {
    event_key: string;
    partner_id?: string | null;
    phone?: string;  // Can also be in payload
    payload: SendTemplatePayload;
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body: SendRequest = await request.json();
        const { event_key, partner_id, payload } = body;

        // DEBUG: Trace received request
        console.log(`[WhatsApp Debug API] Received request`, {
            event_key,
            partner_id,
            partner_id_type: typeof partner_id,
        });

        // Get phone from body or payload
        const phone = body.phone || (payload.phone as string);

        // ─────────────────────────────────────────────────────────────────
        // STEP 1: Validate event_key exists in eventContext
        // ─────────────────────────────────────────────────────────────────
        if (!event_key) {
            return NextResponse.json(
                { success: false, error: 'event_key is required' },
                { status: 400 }
            );
        }

        if (!isValidEventKey(event_key)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Invalid event_key: '${event_key}'`,
                    valid_events: Object.values(WHATSAPP_EVENTS)
                },
                { status: 400 }
            );
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 2: Validate phone number
        // ─────────────────────────────────────────────────────────────────
        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'phone is required (in body or payload)' },
                { status: 400 }
            );
        }

        // Clean phone number
        const cleanPhone = String(phone).replace(/[^0-9]/g, '');
        if (cleanPhone.length < 10) {
            return NextResponse.json(
                { success: false, error: 'Invalid phone number format (minimum 10 digits)' },
                { status: 400 }
            );
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 3: Validate payload exists
        // ─────────────────────────────────────────────────────────────────
        if (!payload || typeof payload !== 'object') {
            return NextResponse.json(
                { success: false, error: 'payload object is required' },
                { status: 400 }
            );
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 4: Resolve template from DB by event_key
        // Priority: Partner-specific > Default (partner_id IS NULL)
        // ─────────────────────────────────────────────────────────────────
        const template = await resolveTemplateByEvent(event_key, partner_id);

        if (!template) {
            // DEBUG: More detailed error info
            console.warn(`[Event Send] No template found for event '${event_key}'`, {
                partner_id,
                attempted_partner_lookup: !!partner_id,
                attempted_default_lookup: true
            });

            return NextResponse.json(
                {
                    success: false,
                    error: `No active template found for event '${event_key}'`,
                    details: {
                        event_key,
                        partner_id,
                        hint: 'Ensure a template with this event_key exists and is_active = true. If partner_id is provided, checks for specific override first, then default.',
                        debug_note: 'Check if default template exists (partner_id IS NULL)'
                    }
                },
                { status: 404 }
            );
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 5: Check template is approved
        // ─────────────────────────────────────────────────────────────────
        if (template.status?.toLowerCase().trim() !== 'approved') {
            return NextResponse.json(
                {
                    success: false,
                    error: `Template '${template.template_key}' is not approved`,
                    details: {
                        template_key: template.template_key,
                        status: template.status
                    }
                },
                { status: 400 }
            );
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 6: Build args from payload using arg_mapping
        // ─────────────────────────────────────────────────────────────────
        const { args, errors } = buildTemplateArgs(template.arg_mapping || {}, payload);

        if (errors.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Argument errors: ${errors.join(', ')}`,
                    details: {
                        template_key: template.template_key,
                        errors,
                        arg_mapping: template.arg_mapping,
                        received_payload_keys: Object.keys(payload)
                    }
                },
                { status: 400 }
            );
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 7: Build preview message for logging
        // ─────────────────────────────────────────────────────────────────
        const resolvedMessage = buildPreviewMessage(template.message_body, args);

        // ─────────────────────────────────────────────────────────────────
        // STEP 8: Format phone number for Nextel (91XXXXXXXXXX)
        // ─────────────────────────────────────────────────────────────────
        const formattedPhone = cleanPhone.startsWith('91')
            ? cleanPhone
            : cleanPhone.length === 10
                ? `91${cleanPhone}`
                : cleanPhone;

        // ─────────────────────────────────────────────────────────────────
        // STEP 9: Extract image URL if template has image
        // ─────────────────────────────────────────────────────────────────
        let imageUrl: string | undefined;
        if (template.has_image && template.image_payload_key) {
            imageUrl = payload[template.image_payload_key] as string | undefined;
            if (!imageUrl) {
                console.warn(`[Event Send] Template has image but payload missing key: ${template.image_payload_key}`);
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 10: Send via Nextel API
        // ─────────────────────────────────────────────────────────────────
        console.log('[Event Send] Sending template:', {
            event_key,
            template_key: template.template_key,
            template_id: template.template_id,
            phone: formattedPhone,
            argsCount: args.length,
            hasImage: !!imageUrl,
            args: args.map((a, i) => `{{${i + 1}}}: ${a.substring(0, 50)}${a.length > 50 ? '...' : ''}`),
        });

        const sendResult = await sendNextelTemplate(
            formattedPhone,
            template.template_key,  // Nextel expects template NAME, not numeric ID
            args,
            partner_id || template.partner_id || undefined,
            {
                templateKey: template.template_key,
                imageUrl,  // Pass image URL if available
            }
        );

        const duration = Date.now() - startTime;

        if (sendResult.success) {
            // NOTE: Do NOT insert to whatsapp_logs here!
            // sendNextelTemplate() already handles logging (creates pending → updates to sent)
            // Adding another insert here would create duplicate records.

            console.log(`[Event Send] ✅ Success in ${duration}ms:`, {
                messageId: sendResult.messageId,
                event_key,
                template_key: template.template_key,
            });

            return NextResponse.json({
                success: true,
                message: 'Message sent successfully',
                data: {
                    messageId: sendResult.messageId,
                    event_key,
                    template_key: template.template_key,
                    template_name: template.template_name,
                    phone: formattedPhone,
                    args,
                    resolvedMessage,
                    duration_ms: duration,
                },
            });
        } else {
            console.error(`[Event Send] ❌ Failed in ${duration}ms:`, sendResult.error);

            return NextResponse.json(
                {
                    success: false,
                    error: sendResult.error || 'Failed to send message',
                    template_key: template.template_key,
                    duration_ms: duration,
                },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('[Event Send] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send message'
            },
            { status: 500 }
        );
    }
}

// ============================================================================
// GET - Health check and documentation
// ============================================================================

export async function GET() {
    return NextResponse.json({
        name: 'WhatsApp Event Send API',
        version: '2.0',
        description: 'DB-driven WhatsApp template sending by event_key',
        usage: {
            method: 'POST',
            body: {
                event_key: 'string (required) - from WHATSAPP_EVENTS',
                partner_id: 'string (optional) - for partner-specific templates',
                phone: 'string (required) - can also be in payload',
                payload: 'object (required) - data matching arg_mapping keys'
            }
        },
        valid_events: Object.values(WHATSAPP_EVENTS),
        example: {
            event_key: 'wallet_topup',
            partner_id: 'abc-123',
            payload: {
                phone: '919876543210',
                customer_name: 'Rahul Sharma',
                partner_name: 'One Club',
                action_type: 'TOPUP',
                wallet_balance: 5000,
                date_time: new Date().toISOString()
            }
        }
    });
}

