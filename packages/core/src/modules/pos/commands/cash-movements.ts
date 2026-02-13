import { z } from 'zod'
import type { CommandHandler } from '@open-mercato/shared/lib/commands'
import { registerCommand } from '@open-mercato/shared/lib/commands'
import type { EntityManager } from '@mikro-orm/postgresql'
import { buildChanges, emitCrudSideEffects, emitCrudUndoSideEffects } from '@open-mercato/shared/lib/commands/helpers'
import { withAtomicFlush } from '@open-mercato/shared/lib/commands/flush'
import type { DataEngine } from '@open-mercato/shared/lib/data/engine'
import type { CrudIndexerConfig } from '@open-mercato/shared/lib/crud/types'
import type { RequiredEntityData } from '@mikro-orm/core'
import { E } from '#generated/entities.ids.generated'
import { PosCashMovement } from '../data/entities'
import {
    posCashMovementCreateSchema,
    type PosCashMovementCreateInput,
} from '../data/validators'
import { ensureOrganizationScope, ensureTenantScope, extractUndoPayload } from './shared'

const posCashMovementCrudIndexer: CrudIndexerConfig<PosCashMovement> = {
    entityType: E.pos.pos_cash_movement,
}

export type PosCashMovementSnapshot = {
    id: string
    organizationId: string
    tenantId: string
    sessionId: string
    type: 'cash_in' | 'cash_out' | 'float_adjustment' | 'payout'
    amount: string
    reason: string
    reference: string | null
    createdByUserId: string
}

export type PosCashMovementUndoPayload = {
    before?: PosCashMovementSnapshot | null
    after?: PosCashMovementSnapshot | null
}

export function loadPosCashMovementSnapshot(movement: PosCashMovement): PosCashMovementSnapshot {
    return {
        id: movement.id,
        organizationId: movement.organizationId,
        tenantId: movement.tenantId,
        sessionId: movement.sessionId,
        type: movement.type,
        amount: movement.amount,
        reason: movement.reason,
        reference: movement.reference ?? null,
        createdByUserId: movement.createdByUserId,
    }
}

export const createPosCashMovementCommand: CommandHandler<PosCashMovementCreateInput, { id: string }> = {
    id: 'pos.cash.movement.create',
    isUndoable: true,
    async execute(input, ctx) {
        ensureOrganizationScope(ctx, input.organizationId)
        ensureTenantScope(ctx, input.tenantId)

        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const now = new Date()

        const movement = em.create(PosCashMovement, {
            ...input,
            createdAt: now,
            updatedAt: now,
        } as RequiredEntityData<PosCashMovement>)

        await withAtomicFlush(em, [
            () => { em.persist(movement) }
        ], { transaction: true, label: 'pos.cash.movement.create' })

        const de = ctx.container.resolve('dataEngine') as DataEngine
        await emitCrudSideEffects({
            dataEngine: de,
            action: 'created',
            entity: movement,
            identifiers: {
                id: movement.id,
                organizationId: movement.organizationId,
                tenantId: movement.tenantId,
            },
            indexer: posCashMovementCrudIndexer,
        })

        return { id: movement.id }
    },
    async buildLog({ input, result, snapshots }) {
        return {
            tenantId: input.tenantId,
            organizationId: input.organizationId,
            resourceKind: E.pos.pos_cash_movement,
            resourceId: result.id,
            snapshotAfter: snapshots.after,
        }
    },
    async captureAfter(input, result, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const movement = await em.findOne(PosCashMovement, { id: result.id })
        return movement ? loadPosCashMovementSnapshot(movement) : null
    },
    async undo({ ctx, logEntry }) {
        const payload = extractUndoPayload<PosCashMovementUndoPayload>(logEntry)
        if (!payload?.after?.id) return

        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const movement = await em.findOne(PosCashMovement, { id: payload.after.id })
        if (movement) {
            await withAtomicFlush(em, [
                () => { em.remove(movement) }
            ], { transaction: true, label: 'pos.cash.movement.create.undo' })

            const de = ctx.container.resolve('dataEngine') as DataEngine
            await emitCrudUndoSideEffects({
                dataEngine: de,
                action: 'deleted',
                entity: movement,
                identifiers: {
                    id: movement.id,
                    organizationId: movement.organizationId,
                    tenantId: movement.tenantId,
                },
                indexer: posCashMovementCrudIndexer,
            })
        }
    },
}

registerCommand(createPosCashMovementCommand)
