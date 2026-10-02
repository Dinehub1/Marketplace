/**
 * WhatsApp Templates Send API
 * 
 * Unified endpoint for sending any WhatsApp template via Nextel API
 * 
 * POST /api/whatsapp/templates/send
 * Body: { templateId, phone, templateArgs, partnerId? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
    sendWhatsAppTemplate, 
    TEMPLATE_CONFIGS,
    type WhatsAppTemplateId 
} from '@/lib/whatsapp/templates';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { templateId, phone, templateArgs, partnerId, walletId, transactionId } = body;

        // Validate required fields
        if (!templateId) {
            return NextResponse.json(
                { 
                    success: false,
                    error: 'Missing required field: templateId',
                    availableTemplates: Object.keys(TEMPLATE_CONFIGS),
                },
                { status: 400 }
            );
        }

        if (!phone) {
            return NextResponse.json(
                { 
                    success: false,
                    error: 'Missing required field: phone',
                },
                { status: 400 }
            );
        }

        if (!templateArgs || !Array.isArray(templateArgs)) {
            return NextResponse.json(
                { 
                    success: false,
                    error: 'Missing or invalid field: templateArgs (must be an array)',
                },
                { status: 400 }
            );
        }

        // Validate template exists
        const templateConfig = TEMPLATE_CONFIGS[templateId as WhatsAppTemplateId];
        if (!templateConfig) {
            return NextResponse.json(
                { 
                    success: false,
                    error: `Unknown template ID: ${templateId}`,
                    availableTemplates: Object.keys(TEMPLATE_CONFIGS),
                },
                { status: 400 }
            );
        }

        // Validate argument count
        if (templateArgs.length !== templateConfig.argCount) {
            return NextResponse.json(
                { 
                    success: false,
                    error: `Template ${templateId} requires ${templateConfig.argCount} arguments, got ${templateArgs.length}`,
                    expectedArgs: templateConfig.argDescriptions,
                    sampleArgs: templateConfig.sampleArgs,
                },
                { status: 400 }
            );
        }

        // Send the template
        const result = await sendWhatsAppTemplate({
            phone,
            templateId: templateId as WhatsAppTemplateId,
            templateArgs,
            partnerId,
            walletId,
            transactionId,
        });

        // Return result
        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'WhatsApp template message sent successfully',
                templateId,
                templateName: templateConfig.name,
                phone,
                messageId: result.messageId || null,
                timestamp: new Date().toISOString(),
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'Failed to send WhatsApp template message',
                details: result.error,
                templateId,
                phone,
                timestamp: new Date().toISOString(),
            }, { status: 500 });
        }

    } catch (error) {
        console.error('[WhatsApp Templates API] Error:', error);
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

/**
 * GET /api/whatsapp/templates/send
 * Returns available templates and their configurations
 */
export async function GET() {
    return NextResponse.json({
        success: true,
        templates: Object.entries(TEMPLATE_CONFIGS).map(([id, config]) => ({
            id,
            name: config.name,
            description: config.description,
            argCount: config.argCount,
            argDescriptions: config.argDescriptions,
            hasImage: config.hasImage || false,
            sampleArgs: config.sampleArgs,
        })),
        usage: {
            method: 'POST',
            endpoint: '/api/whatsapp/templates/send',
            body: {
                templateId: 'string (required)',
                phone: 'string (required, with country code)',
                templateArgs: 'string[] (required)',
                partnerId: 'string (optional)',
                walletId: 'string (optional)',
                transactionId: 'string (optional)',
            },
        },
        timestamp: new Date().toISOString(),
    });
}

