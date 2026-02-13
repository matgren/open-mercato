/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { resolveTranslations } from '@open-mercato/shared/lib/i18n/server'
import { resolveCrudRecordId, parseScopedCommandInput } from '@open-mercato/shared/lib/api/scoped'
import { PosReceipt } from '../data/entities'
import {
    posReceiptSchema,
    posReceiptCreateSchema,
} from '../data/validators'
import { E } from '#generated/entities.ids.generated'
import {
    buildPosCrudOpenApi,
    createPagedListResponseSchema,
    defaultOkResponseSchema
} from './openapi'

const routeMetadata = {
    GET: { requireAuth: true, requireFeatures: ['pos.receipt.view'] },
    POST: { requireAuth: true, requireFeatures: ['pos.receipt.generate'] },
    DELETE: { requireAuth: true, requireFeatures: ['pos.receipt.manage'] },
}

export const metadata = routeMetadata

// POST input for receipt generation is slightly different from entity creation
// We use the command input schema defined in the validator or just partial
// actually the command uses `GeneratePosReceiptInput` interface in the command file
// let's define a schema for the API input here or reuse if available.
// The command expects: organizationId, tenantId, cartId, deliveryMethod, recipient, metadata
// We can define a schema here or import. `posReceiptCreateSchema` is for the entity,
// but the command logic creates the entity. The command input is what we need.

const generateReceiptSchema = z.object({
    cartId: z.string().uuid(),
    deliveryMethod: z.enum(['print', 'email', 'sms']),
    recipient: z.string().optional().nullable(),
    metadata: z.record(z.unknown()).optional().nullable(),
})

const listSchema = z
    .object({
        page: z.coerce.number().min(1).default(1),
        pageSize: z.coerce.number().min(1).max(100).default(50),
        id: z.string().uuid().optional(),
        receiptNumber: z.string().optional(),
        cartId: z.string().uuid().optional(),
        sortField: z.string().optional(),
        sortDir: z.enum(['asc', 'desc']).optional(),
    })
    .passthrough()

const crud = makeCrudRoute({
    metadata: routeMetadata,
    orm: {
        entity: PosReceipt,
        idField: 'id',
        orgField: 'organizationId',
        tenantField: 'tenantId',
        softDeleteField: 'deletedAt',
    },
    indexer: { entityType: E.pos.pos_receipt },
    list: {
        schema: listSchema,
        entityId: E.pos.pos_receipt,
        fields: [
            'id',
            'receiptNumber',
            'cartId',
            'issuedAt',
            'deliveryMethod',
            'recipient',
            'organizationId',
            'tenantId',
            'createdAt',
        ],
        sortFieldMap: {
            issuedAt: 'issuedAt',
            createdAt: 'createdAt',
        },
        buildFilters: async (query: any) => {
            const filters: Record<string, any> = {}
            if (query.id) filters.id = { $eq: query.id }
            if (query.receiptNumber) filters.receiptNumber = { $like: `${query.receiptNumber}%` }
            if (query.cartId) filters.cartId = { $eq: query.cartId }
            return filters
        },
    },
    actions: {
        create: {
            commandId: 'pos.receipt.generate', // Map to the generate command
            schema: generateReceiptSchema,
            mapInput: async ({ raw, ctx }) => {
                const { translate } = await resolveTranslations()
                // The generate command expects inputs that match the schema we defined above
                // plus the scoped args (orgId, tenantId) injected by parseScopedCommandInput
                return parseScopedCommandInput(generateReceiptSchema, raw ?? {}, ctx, translate)
            },
            response: ({ result }) => ({ ok: true, item: result }), // Result contains receiptId and receiptNumber
            status: 201,
        },
        // Update is not allowed for receipts usually, they are immutable records.
        // But if needed we can add it later. For now, only Create (Generate), List, Get, Delete.
        delete: {
            commandId: 'pos.receipt.delete', // We haven't implemented this command yet?
            // Wait, development log says C19/C20 implemented entity and generation.
            // It didn't explicitly say "delete" command was implemented.
            // Let's check shared.ts or just omit delete for now if command doesn't exist?
            // "Everything that modifies DB should be undoable".
            // If I omit delete from API, I don't need the command immediately exposed.
            // But `makeCrudRoute` usually expects standard CRUD.
            // If I don't provide `update` key, it won't generate PUT.
            // If I don't provide `delete` key, it won't generate DELETE.
            // Let's stick to Generate & Read for now as receipts are immutable history.
            // Actually, I'll add DELETE if I find the command or if I can implement a generic delete?
            // I'll stick to what I know exists: 'pos.receipt.generate'.
        },
    },
})

export const GET = crud.GET
export const POST = crud.POST

// We might want DELETE if we implemented it?
// Checking `development_log.md` C20 says "PosReceipt Generation Logic".
// It doesn't mention Delete.
// I will omit DELETE for now to be safe and strictly follow what exists.
// If user needs delete, they can request it.

// OpenAPI
const posReceiptListItemSchema = posReceiptSchema.pick({
    id: true,
    receiptNumber: true,
    cartId: true,
    issuedAt: true,
    deliveryMethod: true,
    recipient: true,
    createdAt: true,
})

export const openApi = {
    ...buildPosCrudOpenApi({
        resourceName: 'PosReceipt',
        pluralName: 'PosReceipts',
        querySchema: listSchema,
        listResponseSchema: createPagedListResponseSchema(posReceiptListItemSchema),
        create: {
            schema: generateReceiptSchema,
            description: 'Generates a new POS receipt.',
            // The response schema for create is different (it yields the receipt or simple result)
            // simplified for now implies it returns the item/result
        },
        // No update or delete
    }),
}
