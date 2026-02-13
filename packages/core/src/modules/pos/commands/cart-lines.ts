import type { CommandHandler } from '@open-mercato/shared/lib/commands'
import { registerCommand } from '@open-mercato/shared/lib/commands'
import type { EntityManager } from '@mikro-orm/postgresql'
import { buildChanges, emitCrudSideEffects, emitCrudUndoSideEffects } from '@open-mercato/shared/lib/commands/helpers'
import { withAtomicFlush } from '@open-mercato/shared/lib/commands/flush'
import type { DataEngine } from '@open-mercato/shared/lib/data/engine'
import type { CrudIndexerConfig } from '@open-mercato/shared/lib/crud/types'
import type { RequiredEntityData } from '@mikro-orm/core'
import { E } from '#generated/entities.ids.generated'
import { PosCartLine } from '../data/entities'
import {
    posCartLineCreateSchema,
    posCartLineUpdateSchema,
    type PosCartLineCreateInput,
    type PosCartLineUpdateInput,
} from '../data/validators'
import {
    ensureOrganizationScope,
    ensureTenantScope,
    extractUndoPayload,
    requirePosCart,
    requirePosCartLine,
} from './shared'

const cartLineCrudIndexer: CrudIndexerConfig<PosCartLine> = {
    entityType: E.pos.pos_cart_line,
}

export type CartLineSnapshot = {
    id: string
    organizationId: string
    tenantId: string
    cartId: string
    productId: string
    productVariantId: string | null
    name: string
    description: string | null
    quantity: string
    unitPrice: string
    taxAmount: string
    totalAmount: string
    metadata: Record<string, unknown> | null
}

export type CartLineUndoPayload = {
    before?: CartLineSnapshot | null
    after?: CartLineSnapshot | null
}

export function loadPosCartLineSnapshot(line: PosCartLine): CartLineSnapshot {
    return {
        id: line.id,
        organizationId: line.organizationId,
        tenantId: line.tenantId,
        cartId: line.cartId,
        productId: line.productId,
        productVariantId: line.productVariantId ?? null,
        name: line.name,
        description: line.description ?? null,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxAmount: line.taxAmount,
        totalAmount: line.totalAmount,
        metadata: line.metadata ?? null,
    }
}

export const addPosCartLineCommand: CommandHandler<PosCartLineCreateInput, { id: string }> = {
    id: 'pos.cart.line.add',
    isUndoable: true,
    async execute(input, ctx) {
        ensureOrganizationScope(ctx, input.organizationId)
        ensureTenantScope(ctx, input.tenantId)

        const em = (ctx.container.resolve('em') as EntityManager).fork()

        // Ensure cart exists
        await requirePosCart(em, input.cartId)

        const now = new Date()
        const line = em.create(PosCartLine, {
            ...input,
            createdAt: now,
            updatedAt: now,
        } as RequiredEntityData<PosCartLine>)

        await withAtomicFlush(em, [
            () => { em.persist(line) }
        ], { transaction: true, label: 'pos.cart.line.add' })

        const de = ctx.container.resolve('dataEngine') as DataEngine
        await emitCrudSideEffects({
            dataEngine: de,
            action: 'created',
            entity: line,
            identifiers: {
                id: line.id,
                organizationId: line.organizationId,
                tenantId: line.tenantId,
            },
            indexer: cartLineCrudIndexer,
        })

        return { id: line.id }
    },
    async buildLog({ input, result, snapshots }) {
        return {
            tenantId: input.tenantId,
            organizationId: input.organizationId,
            resourceKind: E.pos.pos_cart_line,
            resourceId: result.id,
            snapshotAfter: snapshots.after,
        }
    },
    async captureAfter(input, result, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const line = await em.findOne(PosCartLine, { id: result.id })
        return line ? loadPosCartLineSnapshot(line) : null
    },
    async undo({ ctx, logEntry }) {
        const payload = extractUndoPayload<CartLineUndoPayload>(logEntry)
        if (!payload?.after?.id) return

        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const line = await em.findOne(PosCartLine, { id: payload.after.id })
        if (line) {
            await withAtomicFlush(em, [
                () => { em.remove(line) }
            ], { transaction: true, label: 'pos.cart.line.add.undo' })

            const de = ctx.container.resolve('dataEngine') as DataEngine
            await emitCrudUndoSideEffects({
                dataEngine: de,
                action: 'deleted',
                entity: line,
                identifiers: {
                    id: line.id,
                    organizationId: line.organizationId,
                    tenantId: line.tenantId,
                },
                indexer: cartLineCrudIndexer,
            })
        }
    },
}

export const updatePosCartLineCommand: CommandHandler<PosCartLineUpdateInput, { id: string }> = {
    id: 'pos.cart.line.update',
    isUndoable: true,
    async prepare(input, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const line = await em.findOne(PosCartLine, { id: input.id })
        return { before: line ? loadPosCartLineSnapshot(line) : null }
    },
    async execute(input, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const line = await requirePosCartLine(em, input.id)
        ensureOrganizationScope(ctx, line.organizationId)
        ensureTenantScope(ctx, line.tenantId)

        await withAtomicFlush(em, [
            () => {
                if (input.name !== undefined) line.name = input.name
                if (input.description !== undefined) line.description = input.description
                if (input.quantity !== undefined) line.quantity = input.quantity
                if (input.unitPrice !== undefined) line.unitPrice = input.unitPrice
                if (input.taxAmount !== undefined) line.taxAmount = input.taxAmount
                if (input.totalAmount !== undefined) line.totalAmount = input.totalAmount
                if (input.metadata !== undefined) line.metadata = input.metadata

                line.updatedAt = new Date()
            }
        ], { transaction: true, label: 'pos.cart.line.update' })

        const de = ctx.container.resolve('dataEngine') as DataEngine
        await emitCrudSideEffects({
            dataEngine: de,
            action: 'updated',
            entity: line,
            identifiers: {
                id: line.id,
                organizationId: line.organizationId,
                tenantId: line.tenantId,
            },
            indexer: cartLineCrudIndexer,
        })

        return { id: line.id }
    },
    async buildLog({ result, snapshots }) {
        const before = snapshots.before as CartLineSnapshot
        const after = snapshots.after as CartLineSnapshot
        return {
            tenantId: after.tenantId,
            organizationId: after.organizationId,
            resourceKind: E.pos.pos_cart_line,
            resourceId: result.id,
            snapshotBefore: before,
            snapshotAfter: after,
            changes: buildChanges(before, after, [
                'name',
                'description',
                'quantity',
                'unitPrice',
                'taxAmount',
                'totalAmount',
            ]),
        }
    },
    async captureAfter(input, result, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const line = await em.findOne(PosCartLine, { id: result.id })
        return line ? loadPosCartLineSnapshot(line) : null
    },
    async undo({ ctx, logEntry }) {
        const payload = extractUndoPayload<CartLineUndoPayload>(logEntry)
        if (!payload?.before || !payload?.after) return

        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const line = await em.findOne(PosCartLine, { id: payload.after.id })
        if (line) {
            await withAtomicFlush(em, [
                () => {
                    if (!payload.before) return
                    Object.assign(line, payload.before)
                    line.updatedAt = new Date()
                }
            ], { transaction: true, label: 'pos.cart.line.update.undo' })

            const de = ctx.container.resolve('dataEngine') as DataEngine
            await emitCrudUndoSideEffects({
                dataEngine: de,
                action: 'updated',
                entity: line,
                identifiers: {
                    id: line.id,
                    organizationId: line.organizationId,
                    tenantId: line.tenantId,
                },
                indexer: cartLineCrudIndexer,
            })
        }
    },
}

export const deletePosCartLineCommand: CommandHandler<{ id: string }, { id: string }> = {
    id: 'pos.cart.line.delete',
    isUndoable: true,
    async prepare(input, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const line = await em.findOne(PosCartLine, { id: input.id })
        return { before: line ? loadPosCartLineSnapshot(line) : null }
    },
    async execute(input, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const line = await requirePosCartLine(em, input.id)
        ensureOrganizationScope(ctx, line.organizationId)
        ensureTenantScope(ctx, line.tenantId)

        await withAtomicFlush(em, [
            () => {
                const now = new Date()
                line.deletedAt = now
                line.updatedAt = now
            }
        ], { transaction: true, label: 'pos.cart.line.delete' })

        const de = ctx.container.resolve('dataEngine') as DataEngine
        await emitCrudSideEffects({
            dataEngine: de,
            action: 'deleted',
            entity: line,
            identifiers: {
                id: line.id,
                organizationId: line.organizationId,
                tenantId: line.tenantId,
            },
            indexer: cartLineCrudIndexer,
        })

        return { id: line.id }
    },
    async buildLog({ snapshots, result }) {
        const before = snapshots.before as CartLineSnapshot
        return {
            tenantId: before.tenantId,
            organizationId: before.organizationId,
            resourceKind: E.pos.pos_cart_line,
            resourceId: result.id,
            snapshotBefore: before,
        }
    },
    async captureAfter() {
        return null
    },
    async undo({ ctx, logEntry }) {
        const payload = extractUndoPayload<CartLineUndoPayload>(logEntry)
        if (!payload?.before) return

        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const line = await em.findOne(PosCartLine, { id: payload.before.id })
        if (line) {
            await withAtomicFlush(em, [
                () => {
                    line.deletedAt = null
                    line.updatedAt = new Date()
                }
            ], { transaction: true, label: 'pos.cart.line.delete.undo' })

            const de = ctx.container.resolve('dataEngine') as DataEngine
            await emitCrudUndoSideEffects({
                dataEngine: de,
                action: 'updated',
                entity: line,
                identifiers: {
                    id: line.id,
                    organizationId: line.organizationId,
                    tenantId: line.tenantId,
                },
                indexer: cartLineCrudIndexer,
            })
        }
    },
}

registerCommand(addPosCartLineCommand)
registerCommand(updatePosCartLineCommand)
registerCommand(deletePosCartLineCommand)
