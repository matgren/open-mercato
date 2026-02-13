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
import { PosRegister } from '../data/entities'
import {
    posRegisterCreateSchema,
    posRegisterUpdateSchema,
    type PosRegisterCreateInput,
    type PosRegisterUpdateInput,
} from '../data/validators'
import { ensureOrganizationScope, ensureTenantScope, extractUndoPayload, requireRegister } from './shared'

const registerCrudIndexer: CrudIndexerConfig<PosRegister> = {
    entityType: E.pos.pos_register,
}

export type RegisterSnapshot = {
    id: string
    organizationId: string
    tenantId: string
    name: string
    code: string
    description: string | null
    isActive: boolean
}

export type RegisterUndoPayload = {
    before?: RegisterSnapshot | null
    after?: RegisterSnapshot | null
}

export function loadRegisterSnapshot(register: PosRegister): RegisterSnapshot {
    return {
        id: register.id,
        organizationId: register.organizationId,
        tenantId: register.tenantId,
        name: register.name,
        code: register.code,
        description: register.description ?? null,
        isActive: register.isActive,
    }
}

export const createRegisterCommand: CommandHandler<PosRegisterCreateInput, { id: string }> = {
    id: 'pos.register.create',
    isUndoable: true,
    async execute(input, ctx) {
        ensureOrganizationScope(ctx, input.organizationId)
        ensureTenantScope(ctx, input.tenantId)

        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const now = new Date()
        const register = em.create(PosRegister, {
            ...input,
            createdAt: now,
            updatedAt: now,
        } as RequiredEntityData<PosRegister>)

        await withAtomicFlush(em, [
            () => { em.persist(register) }
        ], { transaction: true, label: 'pos.register.create' })

        const de = ctx.container.resolve('dataEngine') as DataEngine
        await emitCrudSideEffects({
            dataEngine: de,
            action: 'created',
            entity: register,
            identifiers: {
                id: register.id,
                organizationId: register.organizationId,
                tenantId: register.tenantId,
            },
            indexer: registerCrudIndexer,
        })

        return { id: register.id }
    },
    async buildLog({ input, result, snapshots }) {
        return {
            tenantId: input.tenantId,
            organizationId: input.organizationId,
            resourceKind: E.pos.pos_register,
            resourceId: result.id,
            snapshotAfter: snapshots.after,
        }
    },
    async captureAfter(input, result, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const register = await em.findOne(PosRegister, { id: result.id })
        return register ? loadRegisterSnapshot(register) : null
    },
    async undo({ ctx, logEntry }) {
        const payload = extractUndoPayload<RegisterUndoPayload>(logEntry)
        if (!payload?.after?.id) return

        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const register = await em.findOne(PosRegister, { id: payload.after.id })
        if (register) {
            await withAtomicFlush(em, [
                () => { em.remove(register) }
            ], { transaction: true, label: 'pos.register.create.undo' })

            const de = ctx.container.resolve('dataEngine') as DataEngine
            await emitCrudUndoSideEffects({
                dataEngine: de,
                action: 'deleted',
                entity: register,
                identifiers: {
                    id: register.id,
                    organizationId: register.organizationId,
                    tenantId: register.tenantId,
                },
                indexer: registerCrudIndexer,
            })
        }
    },
}

export const updateRegisterCommand: CommandHandler<PosRegisterUpdateInput, { id: string }> = {
    id: 'pos.register.update',
    isUndoable: true,
    async prepare(input, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const register = await em.findOne(PosRegister, { id: input.id })
        return { before: register ? loadRegisterSnapshot(register) : null }
    },
    async execute(input, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const register = await requireRegister(em, input.id)
        ensureOrganizationScope(ctx, register.organizationId)
        ensureTenantScope(ctx, register.tenantId)

        await withAtomicFlush(em, [
            () => {
                if (input.name !== undefined) register.name = input.name
                if (input.code !== undefined) register.code = input.code
                if (input.description !== undefined) register.description = input.description
                if (input.isActive !== undefined) register.isActive = input.isActive
                if (input.metadata !== undefined) register.metadata = input.metadata

                register.updatedAt = new Date()
            }
        ], { transaction: true, label: 'pos.register.update' })

        const de = ctx.container.resolve('dataEngine') as DataEngine
        await emitCrudSideEffects({
            dataEngine: de,
            action: 'updated',
            entity: register,
            identifiers: {
                id: register.id,
                organizationId: register.organizationId,
                tenantId: register.tenantId,
            },
            indexer: registerCrudIndexer,
        })

        return { id: register.id }
    },
    async buildLog({ result, snapshots }) {
        const before = snapshots.before as RegisterSnapshot
        const after = snapshots.after as RegisterSnapshot
        return {
            tenantId: after.tenantId,
            organizationId: after.organizationId,
            resourceKind: E.pos.pos_register,
            resourceId: result.id,
            snapshotBefore: before,
            snapshotAfter: after,
            changes: buildChanges(before, after, ['name', 'code', 'description', 'isActive']),
        }
    },
    async captureAfter(input, result, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const register = await em.findOne(PosRegister, { id: result.id })
        return register ? loadRegisterSnapshot(register) : null
    },
    async undo({ ctx, logEntry }) {
        const payload = extractUndoPayload<RegisterUndoPayload>(logEntry)
        if (!payload?.before || !payload?.after) return

        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const register = await em.findOne(PosRegister, { id: payload.after.id })
        if (register) {
            await withAtomicFlush(em, [
                () => {
                    if (!payload.before) return
                    Object.assign(register, payload.before)
                    register.updatedAt = new Date()
                }
            ], { transaction: true, label: 'pos.register.update.undo' })

            const de = ctx.container.resolve('dataEngine') as DataEngine
            await emitCrudUndoSideEffects({
                dataEngine: de,
                action: 'updated',
                entity: register,
                identifiers: {
                    id: register.id,
                    organizationId: register.organizationId,
                    tenantId: register.tenantId,
                },
                indexer: registerCrudIndexer,
            })
        }
    },
}

export const deleteRegisterCommand: CommandHandler<{ id: string }, { id: string }> = {
    id: 'pos.register.delete',
    isUndoable: true,
    async prepare(input, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const register = await em.findOne(PosRegister, { id: input.id })
        return { before: register ? loadRegisterSnapshot(register) : null }
    },
    async execute(input, ctx) {
        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const register = await requireRegister(em, input.id)
        ensureOrganizationScope(ctx, register.organizationId)
        ensureTenantScope(ctx, register.tenantId)

        await withAtomicFlush(em, [
            () => {
                const now = new Date()
                register.deletedAt = now
                register.updatedAt = now
            }
        ], { transaction: true, label: 'pos.register.delete' })

        const de = ctx.container.resolve('dataEngine') as DataEngine
        await emitCrudSideEffects({
            dataEngine: de,
            action: 'deleted',
            entity: register,
            identifiers: {
                id: register.id,
                organizationId: register.organizationId,
                tenantId: register.tenantId,
            },
            indexer: registerCrudIndexer,
        })

        return { id: register.id }
    },
    async buildLog({ snapshots, result }) {
        const before = snapshots.before as RegisterSnapshot
        return {
            tenantId: before.tenantId,
            organizationId: before.organizationId,
            resourceKind: E.pos.pos_register,
            resourceId: result.id,
            snapshotBefore: before,
        }
    },
    async captureAfter() {
        return null
    },
    async undo({ ctx, logEntry }) {
        const payload = extractUndoPayload<RegisterUndoPayload>(logEntry)
        if (!payload?.before) return

        const em = (ctx.container.resolve('em') as EntityManager).fork()
        const register = await em.findOne(PosRegister, { id: payload.before.id })
        if (register) {
            await withAtomicFlush(em, [
                () => {
                    register.deletedAt = null
                    register.updatedAt = new Date()
                }
            ], { transaction: true, label: 'pos.register.delete.undo' })

            const de = ctx.container.resolve('dataEngine') as DataEngine
            await emitCrudUndoSideEffects({
                dataEngine: de,
                action: 'updated',
                entity: register,
                identifiers: {
                    id: register.id,
                    organizationId: register.organizationId,
                    tenantId: register.tenantId,
                },
                indexer: registerCrudIndexer,
            })
        }
    },
}

registerCommand(createRegisterCommand)
registerCommand(updateRegisterCommand)
registerCommand(deleteRegisterCommand)
