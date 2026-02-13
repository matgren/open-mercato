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
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const posRegisterUpdateSchema = z.object({
    ...scopedUpdateFields,
    name: z.string().min(1).max(255).optional(),
    code: z.string().min(1).max(50).optional(),
    description: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export type PosRegisterCreateInput = z.infer<typeof posRegisterCreateSchema>
export type PosRegisterUpdateInput = z.infer<typeof posRegisterUpdateSchema>

export const posSessionCreateSchema = z.object({
    ...scopedCreateFields,
    registerId: z.string().uuid(),
    openedByUserId: z.string().uuid(),
    openingFloatAmount: z.string(), // MikroORM `numeric` type is represented as string in TS
    currencyCode: z.string().length(3), // ISO 4217 currency code (e.g., "USD")
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const posSessionUpdateSchema = z.object({
    ...scopedUpdateFields,
    registerId: z.string().uuid().optional(),
    openedByUserId: z.string().uuid().optional(),
    closedByUserId: z.string().uuid().nullable().optional(),
    status: z.enum(['open', 'closed', 'suspended']).optional(),
    closedAt: z.date().nullable().optional(),
    closingCashAmount: z.string().nullable().optional(),
    expectedCashAmount: z.string().nullable().optional(),
    varianceAmount: z.string().nullable().optional(),
    currencyCode: z.string().length(3).optional(),
    openingFloatAmount: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export type PosSessionCreateInput = z.infer<typeof posSessionCreateSchema>
export type PosSessionUpdateInput = z.infer<typeof posSessionUpdateSchema>

export const posSessionSchema = posSessionCreateSchema.merge(posSessionUpdateSchema).extend({
    id: z.string().uuid(),
    status: z.enum(['open', 'closed', 'suspended']),
    openedAt: z.date(),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
})

export const openPosSessionSchema = z.object({
    pin: z.string().min(4).max(6),
})

export const closePosSessionSchema = z.object({
    pin: z.string().min(4).max(6),
    closingCashAmount: z.string(),
    expectedCashAmount: z.string().optional(),
})

export const posCashMovementCreateSchema = z.object({
    ...scopedCreateFields,
    sessionId: z.string().uuid(),
    type: z.enum(['cash_in', 'cash_out', 'float_adjustment', 'payout']),
    amount: z.string(),
    reason: z.string().min(1),
    reference: z.string().nullable().optional(),
    createdByUserId: z.string().uuid(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const posCashMovementUpdateSchema = z.object({
    ...scopedUpdateFields,
    sessionId: z.string().uuid().optional(),
    type: z.enum(['cash_in', 'cash_out', 'float_adjustment', 'payout']).optional(),
    amount: z.string().optional(),
    reason: z.string().min(1).optional(),
    reference: z.string().nullable().optional(),
    createdByUserId: z.string().uuid().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export type PosCashMovementCreateInput = z.infer<typeof posCashMovementCreateSchema>
export type PosCashMovementUpdateInput = z.infer<typeof posCashMovementUpdateSchema>

export const posCashMovementSchema = posCashMovementCreateSchema.merge(posCashMovementUpdateSchema).extend({
    id: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
})

export const posCartCreateSchema = z.object({
    ...scopedCreateFields,
    sessionId: z.string().uuid(),
    status: z.enum(['open', 'completed', 'abandoned']).optional(),
    customerId: z.string().uuid().nullable().optional(),
    salesOrderId: z.string().uuid().nullable().optional(),
    currencyCode: z.string().length(3),
    subtotalAmount: z.string().optional(),
    taxAmount: z.string().optional(),
    grandAmount: z.string().optional(),
    amountReturn: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const posCartUpdateSchema = z.object({
    ...scopedUpdateFields,
    sessionId: z.string().uuid().optional(),
    status: z.enum(['open', 'completed', 'abandoned']).optional(),
    customerId: z.string().uuid().nullable().optional(),
    salesOrderId: z.string().uuid().nullable().optional(),
    currencyCode: z.string().length(3).optional(),
    subtotalAmount: z.string().optional(),
    taxAmount: z.string().optional(),
    grandAmount: z.string().optional(),
    amountReturn: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export type PosCartCreateInput = z.infer<typeof posCartCreateSchema>
export type PosCartUpdateInput = z.infer<typeof posCartUpdateSchema>

export const posCartSchema = posCartCreateSchema.merge(posCartUpdateSchema).extend({
    id: z.string().uuid(),
    status: z.enum(['open', 'completed', 'abandoned']),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
})

export const posCartLineCreateSchema = z.object({
    ...scopedCreateFields,
    cartId: z.string().uuid(),
    productId: z.string().uuid(),
    productVariantId: z.string().uuid().nullable().optional(),
    name: z.string().min(1),
    description: z.string().nullable().optional(),
    quantity: z.string().optional(),
    unitPrice: z.string().optional(),
    taxAmount: z.string().optional(),
    totalAmount: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const posCartLineUpdateSchema = z.object({
    ...scopedUpdateFields,
    cartId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    productVariantId: z.string().uuid().nullable().optional(),
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    quantity: z.string().optional(),
    unitPrice: z.string().optional(),
    taxAmount: z.string().optional(),
    totalAmount: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export type PosCartLineCreateInput = z.infer<typeof posCartLineCreateSchema>
export type PosCartLineUpdateInput = z.infer<typeof posCartLineUpdateSchema>

export const posCartLineSchema = posCartLineCreateSchema.merge(posCartLineUpdateSchema).extend({
    id: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
})

export const posPaymentCreateSchema = z.object({
    ...scopedCreateFields,
    sessionId: z.string().uuid(),
    cartId: z.string().uuid(),
    salesPaymentId: z.string().uuid().nullable().optional(),
    method: z.enum(['cash', 'card', 'voucher', 'gift_card', 'custom']),
    amount: z.string(),
    currencyCode: z.string().length(3),
    status: z.enum(['authorized', 'captured', 'voided', 'refunded']).optional(),
    providerReference: z.string().nullable().optional(),
    changeAmount: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const posPaymentUpdateSchema = z.object({
    ...scopedUpdateFields,
    sessionId: z.string().uuid().optional(),
    cartId: z.string().uuid().optional(),
    salesPaymentId: z.string().uuid().nullable().optional(),
    method: z.enum(['cash', 'card', 'voucher', 'gift_card', 'custom']).optional(),
    amount: z.string().optional(),
    currencyCode: z.string().length(3).optional(),
    status: z.enum(['authorized', 'captured', 'voided', 'refunded']).optional(),
    providerReference: z.string().nullable().optional(),
    changeAmount: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export type PosPaymentCreateInput = z.infer<typeof posPaymentCreateSchema>
export type PosPaymentUpdateInput = z.infer<typeof posPaymentUpdateSchema>

export const posPaymentSchema = posPaymentCreateSchema.merge(posPaymentUpdateSchema).extend({
    id: z.string().uuid(),
    status: z.enum(['authorized', 'captured', 'voided', 'refunded']),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
})
