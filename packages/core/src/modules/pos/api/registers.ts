import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { resolveTranslations } from '@open-mercato/shared/lib/i18n/server'
import { resolveCrudRecordId, parseScopedCommandInput } from '@open-mercato/shared/lib/api/scoped'
import { escapeLikePattern } from '@open-mercato/shared/lib/db/escapeLikePattern'
import { PosRegister } from '../data/entities'
import { posRegisterCreateSchema, posRegisterUpdateSchema } from '../data/validators'
import { E } from '#generated/entities.ids.generated'
import { createPosCrudOpenApi, createPagedListResponseSchema, defaultOkResponseSchema } from './openapi'

const routeMetadata = {
    GET: { requireAuth: true, requireFeatures: ['pos.register.view'] },
    POST: { requireAuth: true, requireFeatures: ['pos.register.manage'] },
    PUT: { requireAuth: true, requireFeatures: ['pos.register.manage'] },
    DELETE: { requireAuth: true, requireFeatures: ['pos.register.manage'] },
}

export const metadata = routeMetadata

const rawBodySchema = z.object({}).passthrough()

const listSchema = z
    .object({
        page: z.coerce.number().min(1).default(1),
        pageSize: z.coerce.number().min(1).max(100).default(50),
        search: z.string().optional(),
        isActive: z.string().optional(),
        ids: z.string().optional(),
        sortField: z.string().optional(),
        sortDir: z.enum(['asc', 'desc']).optional(),
    })
    .passthrough()

const crud = makeCrudRoute({
    metadata: routeMetadata,
    orm: {
        entity: PosRegister,
        idField: 'id',
        orgField: 'organizationId',
        tenantField: 'tenantId',
        softDeleteField: 'deletedAt',
    },
    indexer: { entityType: E.pos.pos_register },
    list: {
        schema: listSchema,
        entityId: E.pos.pos_register,
        fields: ['id', 'organizationId', 'tenantId', 'name', 'code', 'description', 'isActive', 'createdAt', 'updatedAt'],
        sortFieldMap: {
            name: 'name',
            code: 'code',
            createdAt: 'createdAt',
        },
        buildFilters: async (query) => {
            const filters: Record<string, unknown> = {}
            if (query.ids) {
                const ids = query.ids.split(',').map((id) => id.trim()).filter(Boolean)
                if (ids.length) filters.id = { $in: ids }
            }
            if (query.search) {
                const like = `%${escapeLikePattern(query.search)}%`
                filters.$or = [
                    { name: { $ilike: like } },
                    { code: { $ilike: like } },
                ]
            }
            if (query.isActive !== undefined) {
                filters.isActive = query.isActive === 'true'
            }
            return filters
        },
        decorateCustomFields: { entityIds: [E.pos.pos_register] },
    },
    actions: {
        create: {
            commandId: 'pos.register.create',
            schema: rawBodySchema,
            mapInput: async ({ raw, ctx }) => {
                const { translate } = await resolveTranslations()
                return parseScopedCommandInput(posRegisterCreateSchema, raw ?? {}, ctx, translate)
            },
            response: ({ result }) => ({ ok: true, item: result }),
            status: 201,
        },
        update: {
            commandId: 'pos.register.update',
            schema: rawBodySchema,
            mapInput: async ({ raw, ctx }) => {
                const { translate } = await resolveTranslations()
                return parseScopedCommandInput(posRegisterUpdateSchema, raw ?? {}, ctx, translate)
            },
            response: ({ result }) => ({ id: result?.id ?? null }),
        },
        delete: {
            commandId: 'pos.register.delete',
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

const registerListItemSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    tenantId: z.string().uuid(),
    name: z.string(),
    code: z.string(),
    description: z.string().nullable().optional(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const openApi = createPosCrudOpenApi({
    resourceName: 'Register',
    pluralName: 'Registers',
    querySchema: listSchema,
    listResponseSchema: createPagedListResponseSchema(registerListItemSchema),
    create: {
        schema: posRegisterCreateSchema,
        description: 'Creates a new POS register.',
    },
    update: {
        schema: posRegisterUpdateSchema,
        responseSchema: defaultOkResponseSchema,
        description: 'Updates an existing POS register.',
    },
    del: {
        schema: z.object({ id: z.string().uuid() }),
        responseSchema: defaultOkResponseSchema,
        description: 'Deletes a POS register (soft delete).',
    },
})
