/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { resolveTranslations } from '@open-mercato/shared/lib/i18n/server'
import { resolveCrudRecordId, parseScopedCommandInput } from '@open-mercato/shared/lib/api/scoped'
import { PosCashMovement } from '../data/entities'
import {
    posCashMovementCreateSchema,
    posCashMovementUpdateSchema,
    posCashMovementSchema
} from '../data/validators'
import { E } from '#generated/entities.ids.generated'
import {
    buildPosCrudOpenApi,
    createPagedListResponseSchema,
    defaultOkResponseSchema
} from './openapi'

const routeMetadata = {
    GET: { requireAuth: true, requireFeatures: ['pos.cash.movement.view'] },
    POST: { requireAuth: true, requireFeatures: ['pos.cash.movement.manage'] },
    PUT: { requireAuth: true, requireFeatures: ['pos.cash.movement.manage'] },
    DELETE: { requireAuth: true, requireFeatures: ['pos.cash.movement.manage'] },
}

export const metadata = routeMetadata

const rawBodySchema = z.object({}).passthrough()

const listSchema = z
    .object({
        page: z.coerce.number().min(1).default(1),
        pageSize: z.coerce.number().min(1).max(100).default(50),
        sessionId: z.string().uuid().optional(),
        type: z.enum(['cash_in', 'cash_out', 'float_adjustment', 'payout']).optional(),
        sortField: z.string().optional(),
        sortDir: z.enum(['asc', 'desc']).optional(),
    })
    .passthrough()

const crud = makeCrudRoute({
    metadata: routeMetadata,
    orm: {
        entity: PosCashMovement,
        idField: 'id',
        orgField: 'organizationId',
        tenantField: 'tenantId',
        softDeleteField: 'deletedAt',
    },
    indexer: { entityType: E.pos.pos_cash_movement },
    list: {
        schema: listSchema,
        entityId: E.pos.pos_cash_movement,
        fields: [
            'id',
            'sessionId',
            'type',
            'amount',
            'reason',
            'reference',
            'createdByUserId',
            'organizationId',
            'tenantId',
            'createdAt',
        ],
        sortFieldMap: {
            createdAt: 'createdAt',
            amount: 'amount',
        },
        buildFilters: async (query: any) => {
            const filters: Record<string, any> = {}
            if (query.sessionId) filters.sessionId = { $eq: query.sessionId }
            if (query.type) filters.type = { $eq: query.type }
            return filters
        },
    },
    actions: {
        create: {
            commandId: 'pos.cash.movement.create',
            schema: rawBodySchema,
            mapInput: async ({ raw, ctx }) => {
                const { translate } = await resolveTranslations()
                return parseScopedCommandInput(posCashMovementCreateSchema, raw ?? {}, ctx, translate)
            },
            response: ({ result }) => ({ ok: true, item: result }),
            status: 201,
        },
        update: {
            commandId: 'pos.cash.movement.update',
            schema: rawBodySchema,
            mapInput: async ({ raw, ctx }) => {
                const { translate } = await resolveTranslations()
                return parseScopedCommandInput(posCashMovementUpdateSchema, raw ?? {}, ctx, translate)
            },
            response: ({ result }) => ({ ok: true, item: result }),
        },
        delete: {
            commandId: 'pos.cash.movement.delete',
            schema: rawBodySchema,
            mapInput: async ({ parsed, ctx }) => {
                const { translate } = await resolveTranslations()
                const id = resolveCrudRecordId(parsed, ctx, translate)
                return { id }
            },
            response: () => ({ ok: true }),
        },
    },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

// OpenAPI
const posCashMovementListItemSchema = posCashMovementSchema.pick({
    id: true,
    sessionId: true,
    type: true,
    amount: true,
    reason: true,
    reference: true,
    createdByUserId: true,
    createdAt: true,
})

export const openApi = buildPosCrudOpenApi({
    resourceName: 'PosCashMovement',
    pluralName: 'PosCashMovements',
    querySchema: listSchema,
    listResponseSchema: createPagedListResponseSchema(posCashMovementListItemSchema),
    create: {
        schema: posCashMovementCreateSchema,
        description: 'Creates a cash movement.',
    },
    update: {
        schema: posCashMovementUpdateSchema,
        responseSchema: defaultOkResponseSchema,
        description: 'Updates a cash movement.',
    },
    del: {
        schema: z.object({ id: z.string().uuid() }),
        responseSchema: defaultOkResponseSchema,
        description: 'Deletes a cash movement by id.',
    },
})
