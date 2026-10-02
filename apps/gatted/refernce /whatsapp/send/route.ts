/**
 * Unified WhatsApp Send API
 * 
 * Handles all WhatsApp template message sends through a single endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    sendWalletCreatedNotification,
    sendSignupBonusNotification,
    sendTopupNotification,
    sendRedemptionNotification,
    sendItemRedemptionNotification,
    sendSessionCheckinNotification,
    TEMPLATE_KEYS,
} from '@/lib/whatsapp/notifications';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, phone, data, partnerId } = body;

        // Validate required fields
        if (!type || !phone) {
            return NextResponse.json(
                { error: 'Missing required fields: type, phone' },
                { status: 400 }
            );
        }

        // Validate template type
        const validTypes = Object.values(TEMPLATE_KEYS);
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { 
                    error: 'Invalid template type', 
                    validTypes,
                    received: type 
                },
                { status: 400 }
            );
        }

        let result;

        // Route to appropriate notification function
        switch (type) {
            case TEMPLATE_KEYS.WALLET_CREATED:
                // V14: Support both eventName and partnerName for backwards compatibility
                const partnerNameArg = data?.partnerName || data?.eventName;
                if (!data?.customerName || !partnerNameArg || data?.initialBalance === undefined) {
                    return NextResponse.json(
                        { error: 'Missing required data: customerName, partnerName (or eventName), initialBalance' },
                        { status: 400 }
                    );
                }
                result = await sendWalletCreatedNotification(
                    phone,
                    data.customerName,
                    partnerNameArg,
                    data.initialBalance,
                    data.qrCodeUrl || '',
                    partnerId,
                    data.walletId
                );
                break;

            case TEMPLATE_KEYS.SIGNUP_BONUS:
                if (!data?.customerName || data?.bonusAmount === undefined || data?.totalBalance === undefined) {
                    return NextResponse.json(
                        { error: 'Missing required data: customerName, bonusAmount, totalBalance' },
                        { status: 400 }
                    );
                }
                result = await sendSignupBonusNotification(
                    phone,
                    data.customerName,
                    data.bonusAmount,
                    data.totalBalance,
                    partnerId
                );
                break;

            case TEMPLATE_KEYS.TOPUP:
                if (!data?.amount || !data?.eventName || data?.currentBalance === undefined) {
                    return NextResponse.json(
                        { error: 'Missing required data: amount, eventName, currentBalance' },
                        { status: 400 }
                    );
                }
            
            case TEMPLATE_KEYS.REDEEM_BILL:
                if (!data?.amount || !data?.eventName || data?.currentBalance === undefined) {
                    return NextResponse.json(
                        { error: 'Missing required data: amount, eventName, currentBalance' },
                        { status: 400 }
                    );
                }
                result = await sendRedemptionNotification(
                    phone,
                    data.customerName || '',
                    data.eventName,
                    data.amount,
                    data.currentBalance,
                    partnerId
                );
                break;

            case TEMPLATE_KEYS.REDEEM_ITEM:
                if (!data?.items || !data?.amount || !data?.eventName || data?.currentBalance === undefined) {
                    return NextResponse.json(
                        { error: 'Missing required data: items, amount, eventName, currentBalance' },
                        { status: 400 }
                    );
                }
                result = await sendItemRedemptionNotification(
                    phone,
                    data.customerName || '',
                    data.eventName,
                    data.items,
                    data.amount,
                    data.currentBalance,
                    partnerId
                );
                break;

            case TEMPLATE_KEYS.SESSION_CHECKIN:
                if (!data?.customerName || !data?.eventName || data?.currentBalance === undefined || !data?.venueName) {
                    return NextResponse.json(
                        { error: 'Missing required data: customerName, eventName, currentBalance, venueName' },
                        { status: 400 }
                    );
                }
                result = await sendSessionCheckinNotification(
                    phone,
                    data.customerName,
                    data.eventName,
                    data.currentBalance,
                    data.venueName,
                    partnerId
                );
                break;

            default:
                return NextResponse.json(
                    { error: 'Template type not implemented' },
                    { status: 501 }
                );
        }

        // Return result
        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'WhatsApp message sent successfully',
                type,
                phone,
                timestamp: new Date().toISOString(),
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'Failed to send WhatsApp message',
                details: result.error,
                type,
                phone,
                timestamp: new Date().toISOString(),
            }, { status: 500 });
        }

    } catch (error) {
        console.error('[WhatsApp Send API] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
