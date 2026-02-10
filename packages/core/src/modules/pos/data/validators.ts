import { z } from 'zod'

const scopedCreateFields = {
    tenantId: z.string().uuid(),
    organizationId: z.string().uuid(),
}

const scopedUpdateFields = {
    id: z.string().uuid(),
}

export const posRegisterCreateSchema = z.object({
    ...scopedCreateFields,
    name: z.string().min(1).max(255),
    code: z.string().min(1).max(50),
    description: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.unknown()).nullable().optional(),
})

export const posRegisterUpdateSchema = z.object({
    ...scopedUpdateFields,
    name: z.string().min(1).max(255).optional(),
    code: z.string().min(1).max(50).optional(),
    description: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.unknown()).nullable().optional(),
})

export type PosRegisterCreateInput = z.infer<typeof posRegisterCreateSchema>
export type PosRegisterUpdateInput = z.infer<typeof posRegisterUpdateSchema>
